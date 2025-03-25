import { supabase } from '@/lib/supabase';
import { 
  Event, 
  EventDB,
  EventAttendance, 
  EventAttendanceDB, 
  EventItem, 
  EventItemDB,
  EventItemSummary,
  EventMessage, 
  EventMessageDB, 
  convertDBEventToEvent,
  convertDBAttendanceToAttendance,
  convertDBMessageToMessage,
  convertDBItemToItemSummary,
  convertDBAttendanceToUIAttendance,
  convertDBMessageToUIMessage,
  convertDBItemToEventItem,
  EventWithAttendees
} from '@/types/event';
import { getCurrentUser } from '@/services/authService';
import { toast } from '@/components/ui/use-toast';

// Buscar todos os eventos (sem filtros de status ou data)
export async function getUpcomingEvents(): Promise<Event[]> {
  try {
    // Primeiro tenta o método padrão
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        // Filtrar apenas eventos que não estão cancelados
        .neq('status', 'cancelled')
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.log('Erro ao buscar eventos (método padrão):', error);
      
      // Se ocorrer erro de comparação de tipos ou 404 (tabela não existe), tenta usar RPC
      if (error.code === '42883' || error.code === '404') {
        console.log('Tentando buscar eventos via RPC...');
        
        // Utiliza a função RPC que contorna o problema de comparação de tipos
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_active_events'); // Função RPC para buscar eventos não cancelados
        
        if (rpcError) {
          console.error('Erro ao buscar eventos via RPC:', rpcError);
          throw rpcError;
        }
        
        return rpcData || [];
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
}

// Buscar detalhes de um evento específico com participantes
export async function getEventById(id: string): Promise<EventWithAttendees | null> {
  try {
    // Primeiro, busca os detalhes do evento
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (eventError) throw eventError;
    if (!eventData) return null;
    
    // Buscar as confirmações separadamente
    const { data: attendancesData, error: attendancesError } = await supabase
      .from('event_attendances')
      .select('id, status, user_id, created_at')
      .eq('event_id', id);
    
    if (attendancesError) {
      console.error('Error fetching attendees:', attendancesError);
      // Continue mesmo com erro nas participações
    }
    
    let attendees: EventAttendance[] = [];
    
    // Se temos dados de participação, buscar os dados dos usuários
    if (attendancesData && attendancesData.length > 0) {
      // Coletar IDs de usuários para buscar seus dados
      const userIds = attendancesData.map(attendance => attendance.user_id);
      
      // Buscar dados dos usuários na tabela users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, avatar_url, username')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      }
      
      // Juntar dados de participações com dados de usuários
      attendees = attendancesData.map(attendance => {
        const user = usersData?.find(u => u.id === attendance.user_id);
        return {
          id: attendance.id,
          eventId: id,
          userId: attendance.user_id,
          status: attendance.status,
          createdAt: attendance.created_at,
          // Adicionar dados do usuário que encontramos
          user: user ? {
            id: user.id,
            email: user.email || '',
            name: user.first_name || user.username || '',
            avatarUrl: user.avatar_url || null
          } : undefined
        };
      });
    }
    
    // Converter evento para o formato esperado
    const event = convertDBEventToEvent(eventData);
    
    // Retornar evento com lista de participantes
    return {
      ...event,
      attendees
    };
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
}

// Buscar todas as confirmações para um evento
export async function getEventAttendances(eventId: string): Promise<EventAttendance[]> {
  try {
    // Buscar as confirmações
    const { data: attendancesData, error } = await supabase
      .from('event_attendances')
      .select('*')
      .eq('event_id', eventId);
    
    if (error) throw error;
    
    if (!attendancesData || attendancesData.length === 0) {
      return [];
    }
    
    // Extrair IDs de usuários para buscar seus dados
    const userIds = [...new Set(attendancesData.map(attendance => attendance.user_id))];
    
    // Buscar dados dos usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, email, avatar_url, username')
      .in('id', userIds);
    
    if (usersError) {
      console.error('Erro ao buscar usuários para confirmações:', usersError);
      // Continuar mesmo com erro nos usuários
    }
    
    // Buscar os itens para todas as confirmações
    const attendanceIds = attendancesData.map(attendance => attendance.id);
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('event_items')
      .select('*')
      .in('attendance_id', attendanceIds);
    
    if (itemsError) {
      console.error('Erro ao buscar itens para confirmações:', itemsError);
      // Continuar mesmo com erro nos itens
    }
    
    // Mapear os itens para suas respectivas confirmações
    const itemsByAttendanceId = (itemsData || []).reduce((acc, item) => {
      if (!acc[item.attendance_id]) {
        acc[item.attendance_id] = [];
      }
      acc[item.attendance_id].push({
        id: item.id,
        attendance_id: item.attendance_id,
        name: item.name,
        quantity: item.quantity,
        created_at: item.created_at
      });
      return acc;
    }, {} as Record<string, EventItem[]>);
    
    // Combinar os dados de confirmações, usuários e itens
    return attendancesData.map(attendance => {
      // Encontrar o usuário correspondente
      const user = users?.find(u => u.id === attendance.user_id);
      
      return {
        id: attendance.id,
        event_id: attendance.event_id,
        user_id: attendance.user_id,
        user_name: user?.first_name || user?.username || 'Usuário',
        user_avatar: user?.avatar_url || null,
        status: attendance.status as 'confirmed' | 'declined' | 'maybe',
        items: itemsByAttendanceId[attendance.id] || [],
        created_at: attendance.created_at,
        updated_at: attendance.updated_at
      };
    });
  } catch (error) {
    console.error(`Erro ao buscar confirmações do evento ${eventId}:`, error);
    return [];
  }
}

// Verificar status de participação do usuário atual
export async function getUserAttendanceStatus(eventId: string): Promise<EventAttendance | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    // Buscar participação
    const { data, error } = await supabase
      .from('event_attendances')
      .select('id, status, event_id, user_id, created_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // Se o erro for "not found", significa que o usuário não confirmou participação
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    if (!data) return null;
    
    // Converter para o formato esperado
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      status: data.status,
      createdAt: data.created_at
    };
  } catch (error: any) {
    console.error('Error fetching attendance status:', error);
    throw error;
  }
}

// Confirmar presença em um evento
export async function confirmAttendance(
  eventId: string, 
  status: 'confirmed' | 'declined' | 'maybe'
): Promise<EventAttendance> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Verificar se o usuário já confirmou presença
    const existingAttendance = await getUserAttendanceStatus(eventId);
    
    if (existingAttendance) {
      // Atualizar confirmação existente
      const { data: updatedAttendance, error } = await supabase
        .from('event_attendances')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAttendance.id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Criar objeto de resposta manualmente
      return {
        id: updatedAttendance.id,
        event_id: updatedAttendance.event_id,
        user_id: user.id,
        user_name: user.first_name || user.username || 'Usuário',
        user_avatar: user.avatar_url,
        status: updatedAttendance.status,
        created_at: updatedAttendance.created_at,
        updated_at: updatedAttendance.updated_at
      };
    } else {
      // Criar nova confirmação
      const { data: newAttendance, error } = await supabase
        .from('event_attendances')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Criar objeto de resposta manualmente
      return {
        id: newAttendance.id,
        event_id: newAttendance.event_id,
        user_id: user.id,
        user_name: user.first_name || user.username || 'Usuário',
        user_avatar: user.avatar_url,
        status: newAttendance.status,
        created_at: newAttendance.created_at,
        updated_at: newAttendance.updated_at
      };
    }
  } catch (error) {
    console.error(`Erro ao confirmar presença no evento ${eventId}:`, error);
    throw error;
  }
}

// Buscar todos os itens de um evento (resumo)
export async function getEventItemsSummary(eventId: string): Promise<EventItemSummary[]> {
  try {
    // Primeiro, buscar todas as confirmações para o evento
    const { data: attendancesData, error: attendancesError } = await supabase
      .from('event_attendances')
      .select('id, user_id')
      .eq('event_id', eventId);
    
    if (attendancesError) throw attendancesError;
    
    if (!attendancesData || attendancesData.length === 0) {
      return [];
    }
    
    // Extrair IDs de confirmações e usuários
    const attendanceIds = attendancesData.map(a => a.id);
    const userIds = [...new Set(attendancesData.map(a => a.user_id))];
    
    // Buscar dados dos usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, username, avatar_url')
      .in('id', userIds);
    
    if (usersError) {
      console.error('Erro ao buscar usuários para itens:', usersError);
      // Continuar mesmo com erro nos usuários
    }
    
    // Criar mapa usuário ID -> dados do usuário
    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>);
    
    // Criar mapa confirmação ID -> ID do usuário
    const attendanceToUserMap = attendancesData.reduce((acc, attendance) => {
      acc[attendance.id] = attendance.user_id;
      return acc;
    }, {} as Record<string, string>);
    
    // Buscar os itens
    const { data: itemsData, error: itemsError } = await supabase
      .from('event_items')
      .select('*')
      .in('attendance_id', attendanceIds);
    
    if (itemsError) throw itemsError;
    
    if (!itemsData || itemsData.length === 0) {
      return [];
    }
    
    // Combinar os dados de itens, confirmações e usuários
    return itemsData.map(item => {
      const userId = attendanceToUserMap[item.attendance_id];
      const user = userMap[userId] || {};
      
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        user_id: userId,
        user_name: user.first_name || user.username || 'Usuário',
        attendance_id: item.attendance_id
      };
    });
  } catch (error) {
    console.error(`Erro ao buscar itens do evento ${eventId}:`, error);
    return [];
  }
}

// Adicionar um item que o usuário levará para o evento
export async function addEventItem(
  attendanceId: string, 
  itemData: { name: string; quantity: number }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_items')
      .insert({
        attendance_id: attendanceId,
        name: itemData.name,
        quantity: itemData.quantity,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao adicionar item para a confirmação ${attendanceId}:`, error);
    throw error;
  }
}

// Buscar mensagens de um evento
export async function getEventMessages(eventId: string): Promise<EventMessage[]> {
  try {
    const { data: messagesData, error } = await supabase
      .from('event_messages')
      .select('*, user:user_id(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return (messagesData as EventMessageDB[])
      .map(message => convertDBMessageToMessage(message));
  } catch (error) {
    console.error(`Erro ao buscar mensagens do evento ${eventId}:`, error);
    return [];
  }
}

// Enviar uma mensagem no chat do evento
export async function sendEventMessage(
  eventId: string, 
  content: string
): Promise<EventMessage | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    const { data: messageData, error } = await supabase
      .from('event_messages')
      .insert({
        event_id: eventId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString()
      })
      .select('*, user:user_id(*)')
      .single();
    
    if (error) throw error;
    
    return convertDBMessageToMessage(messageData as EventMessageDB);
  } catch (error) {
    console.error(`Erro ao enviar mensagem no evento ${eventId}:`, error);
    throw error;
  }
}

// Criar novo evento (apenas para administradores)
export async function createEvent(eventData: {
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location: string;
  status?: string;
  created_by?: string;
}): Promise<Event | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('Usuário não autenticado ao tentar criar evento');
      toast({
        title: 'Não autenticado',
        description: 'Você precisa estar logado para criar um evento',
        variant: 'destructive'
      });
      return null;
    }
    
    console.log('Usuário tentando criar evento:', user);
    
    // Verificar se o usuário é admin
    const isUserAdmin = user.role === 'admin';
    
    if (!isUserAdmin) {
      console.error(`Usuário ${user.email} não tem permissão para criar eventos (role: ${user.role})`);
      toast({
        title: 'Permissão negada',
        description: 'Apenas administradores podem criar eventos',
        variant: 'destructive'
      });
      return null;
    }
    
    console.log('Inserindo evento no banco de dados:', eventData);
    
    // Garantir que as datas estão no formato ISO (timestamp)
    const formattedEventData = {
      ...eventData,
      date: new Date(eventData.date).toISOString(),
      end_date: eventData.end_date ? new Date(eventData.end_date).toISOString() : null
    };
    
    console.log('Dados formatados para inserção:', formattedEventData);
    
    // Primeiro tenta o método padrão
    try {
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          title: formattedEventData.title,
          description: formattedEventData.description,
          date: formattedEventData.date,
          end_date: formattedEventData.end_date,
          location: formattedEventData.location,
          status: formattedEventData.status || 'upcoming',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (!newEvent) {
        console.error('Evento criado mas não retornado pelo banco');
        throw new Error('Falha ao retornar o evento criado');
      }
      
      console.log('Evento criado com sucesso:', newEvent);
      
      // Converter para o formato da interface Event
      return convertDBEventToEvent(newEvent);
    } catch (error: any) {
      console.error('Erro ao inserir evento:', error);
      
      // Se a tabela não existir (404) ou houver erro de tipo (42883), tenta usar RPC
      if (error.code === '404' || error.code === '42883') {
        console.log('Tentando criar evento via RPC...');
        
        // Utiliza a função RPC que contorna o problema
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('create_event', {
            p_title: formattedEventData.title,
            p_description: formattedEventData.description,
            p_date: formattedEventData.date,
            p_end_date: formattedEventData.end_date,
            p_location: formattedEventData.location,
            p_status: formattedEventData.status || 'upcoming',
            p_user_id: user.id
          });
        
        if (rpcError) {
          console.error('Erro ao criar evento via RPC:', rpcError);
          
          // Se a função RPC também não existe, orienta a executar o script
          if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.code === '404') {
            throw new Error(
              'A tabela de eventos ou a função de criação não existe. ' +
              'Execute o script SQL em src/scripts/create_events_tables.sql no Supabase.'
            );
          }
          
          throw rpcError;
        }
        
        if (!rpcData) {
          throw new Error('Evento não retornado pela função RPC');
        }
        
        console.log('Evento criado com sucesso via RPC:', rpcData);
        return convertDBEventToEvent(rpcData);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
}

// Atualizar evento existente (apenas para administradores)
export async function updateEvent(
  id: string,
  eventData: Partial<{
    title: string;
    description: string;
    date: string;
    end_date?: string | null;
    location: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  }>
): Promise<Event | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Verificar se o usuário é admin
    const isAdmin = user.app_role === 'admin';
    
    if (!isAdmin) {
      toast({
        title: 'Permissão negada',
        description: 'Apenas administradores podem atualizar eventos',
        variant: 'destructive'
      });
      return null;
    }
    
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, user:created_by(*)')
      .single();
    
    if (error) throw error;
    
    return convertDBEventToEvent(updatedEvent as EventDB);
  } catch (error) {
    console.error(`Erro ao atualizar evento ${id}:`, error);
    throw error;
  }
}

// Remover item de confirmação
export async function removeEventItem(itemId: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Primeiro vamos verificar se este item pertence a uma confirmação do usuário
    const { data: itemData, error: fetchError } = await supabase
      .from('event_items')
      .select('*, attendance:event_attendances!inner(user_id)')
      .eq('id', itemId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Verificar se o item pertence ao usuário
    if (itemData.attendance.user_id !== user.id) {
      toast({
        title: 'Permissão negada',
        description: 'Você só pode remover seus próprios itens',
        variant: 'destructive'
      });
      return;
    }
    
    // Remover o item
    const { error } = await supabase
      .from('event_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao remover item ${itemId}:`, error);
    throw error;
  }
}

export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    // Precisamos excluir em ordem todos os dados relacionados ao evento
    // para evitar violações de chave estrangeira

    // 1. Primeiro, buscar todas as participações deste evento para depois excluir itens
    const { data: attendances, error: attendancesError } = await supabase
      .from('event_attendances')
      .select('id')
      .eq('event_id', id);

    if (attendancesError) {
      console.error('Erro ao buscar participações do evento:', attendancesError);
      throw attendancesError;
    }

    // Se houver participações, precisamos excluir os itens relacionados a cada participação
    if (attendances && attendances.length > 0) {
      const attendanceIds = attendances.map(a => a.id);

      // 2. Excluir todos os itens relacionados a estas participações
      const { error: itemsError } = await supabase
        .from('event_items')
        .delete()
        .in('attendance_id', attendanceIds);

      if (itemsError) {
        console.error('Erro ao excluir itens do evento:', itemsError);
        throw itemsError;
      }
    }

    // 3. Excluir todas as mensagens relacionadas ao evento
    const { error: messagesError } = await supabase
      .from('event_messages')
      .delete()
      .eq('event_id', id);

    if (messagesError) {
      console.error('Erro ao excluir mensagens do evento:', messagesError);
      throw messagesError;
    }

    // 4. Excluir todas as participações do evento
    const { error: attendancesDeleteError } = await supabase
      .from('event_attendances')
      .delete()
      .eq('event_id', id);

    if (attendancesDeleteError) {
      console.error('Erro ao excluir participações do evento:', attendancesDeleteError);
      throw attendancesDeleteError;
    }

    // 5. Finalmente, excluir o evento
    const { error: eventDeleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (eventDeleteError) {
      console.error('Erro ao excluir o evento:', eventDeleteError);
      throw eventDeleteError;
    }

    console.log(`Evento ${id} e todos os seus dados relacionados foram excluídos com sucesso`);
  } catch (error) {
    console.error('Erro durante o processo de exclusão do evento:', error);
    throw error;
  }
}

// Attendance functions
export async function cancelAttendance(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('event_attendances')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error canceling attendance:', error);
    throw error;
  }
}

export async function getAttendanceForUser(eventId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('event_attendances')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No attendance found
      return null;
    }
    console.error('Error fetching attendance status:', error);
    throw error;
  }

  return data?.status || null;
} 