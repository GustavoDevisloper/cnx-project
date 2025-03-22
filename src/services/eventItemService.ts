import { supabase } from '@/lib/supabase';
import { EventItem, EventItemFormInput, EventItemSummary } from '@/types/event';

export async function getItemsByAttendance(attendanceId: string): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('event_items')
    .select('*')
    .eq('attendance_id', attendanceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    throw error;
  }

  return data || [];
}

export async function getItemsByEvent(eventId: string): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('event_items')
    .select(`
      *,
      event_attendances!inner(
        event_id
      )
    `)
    .eq('event_attendances.event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching items for event:', error);
    throw error;
  }

  return data || [];
}

/**
 * Busca todos os itens de um evento com informações dos participantes
 * Esta função pode ser usada para exibir uma lista completa de itens para todos
 */
export async function getEventItemsWithUserInfo(eventId: string): Promise<EventItemSummary[]> {
  try {
    // Primeiro, buscar as confirmações para o evento
    const { data: attendancesData, error: attendancesError } = await supabase
      .from('event_attendances')
      .select('id, user_id')
      .eq('event_id', eventId);
    
    if (attendancesError) {
      console.error('Error fetching attendances:', attendancesError);
      throw attendancesError;
    }
    
    if (!attendancesData || attendancesData.length === 0) {
      return [];
    }
    
    // Obter IDs de confirmações para buscar os itens
    const attendanceIds = attendancesData.map(a => a.id);
    
    // Extrair IDs de usuários únicos
    const userIds = [...new Set(attendancesData.map(a => a.user_id))];
    
    // Buscar informações dos usuários
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, username, avatar_url')
      .in('id', userIds);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continuamos mesmo com erro para mostrar pelo menos os itens
    }
    
    // Criar mapa de usuários para fácil acesso
    const userMap = (usersData || []).reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {} as Record<string, any>);
    
    // Criar mapa de confirmações para usuários
    const attendanceToUserMap = attendancesData.reduce((map, attendance) => {
      map[attendance.id] = attendance.user_id;
      return map;
    }, {} as Record<string, string>);
    
    // Buscar todos os itens para as confirmações deste evento
    const { data: itemsData, error: itemsError } = await supabase
      .from('event_items')
      .select('*')
      .in('attendance_id', attendanceIds);
    
    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }
    
    if (!itemsData || itemsData.length === 0) {
      return [];
    }
    
    // Mapear itens para incluir informações do usuário
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
    console.error('Error getting event items with user info:', error);
    return [];
  }
}

export async function addItem(attendanceId: string, item: EventItemFormInput): Promise<EventItem> {
  const { data, error } = await supabase
    .from('event_items')
    .insert({
      attendance_id: attendanceId,
      name: item.name,
      quantity: item.quantity
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    throw error;
  }

  return data;
}

export async function updateItem(itemId: string, item: Partial<EventItemFormInput>): Promise<EventItem> {
  const { data, error } = await supabase
    .from('event_items')
    .update(item)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating item:', error);
    throw error;
  }

  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('event_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
} 