import { supabase } from '@/lib/supabase';
import { EventMessage, EventMessageFormInput } from '@/types/event';

export async function getMessagesByEvent(eventId: string): Promise<EventMessage[]> {
  try {
    // Buscar mensagens do evento
    const { data: messages, error } = await supabase
      .from('event_messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Extrair IDs de usuários para buscar seus dados
    const userIds = [...new Set(messages.map(message => message.user_id))];

    // Buscar dados dos usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, email, avatar_url, username')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users for messages:', usersError);
      // Continuar mesmo com erro nos usuários, para pelo menos mostrar as mensagens
    }

    // Combinar mensagens com dados de usuários
    return messages.map(message => {
      const user = users?.find(u => u.id === message.user_id);
      return {
        id: message.id,
        event_id: message.event_id,
        user_id: message.user_id,
        content: message.content,
        created_at: message.created_at,
        user: user ? {
          id: user.id,
          name: user.first_name || user.username || '',
          email: user.email || '',
          avatar_url: user.avatar_url
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error processing messages:', error);
    throw error;
  }
}

export async function sendMessage(
  eventId: string,
  userId: string,
  message: EventMessageFormInput
): Promise<EventMessage> {
  const { data, error } = await supabase
    .from('event_messages')
    .insert({
      event_id: eventId,
      user_id: userId,
      content: message.content
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('event_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

export function subscribeToEventMessages(
  eventId: string,
  callback: (message: EventMessage) => void
) {
  return supabase
    .channel(`event-messages-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`
      },
      (payload) => {
        // Fetch the complete message with user data
        getCompleteMessage(payload.new.id)
          .then((message) => {
            if (message) {
              callback(message);
            }
          })
          .catch(error => {
            console.error('Error fetching complete message:', error);
          });
      }
    )
    .subscribe();
}

async function getCompleteMessage(messageId: string): Promise<EventMessage | null> {
  try {
    // Buscar a mensagem
    const { data: message, error } = await supabase
      .from('event_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching complete message:', error);
      return null;
    }

    if (!message) return null;

    // Buscar os dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, email, avatar_url, username')
      .eq('id', message.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user for message:', userError);
    }

    // Retornar mensagem completa
    return {
      id: message.id,
      event_id: message.event_id,
      user_id: message.user_id,
      content: message.content,
      created_at: message.created_at,
      user: user ? {
        id: user.id,
        name: user.first_name || user.username || '',
        email: user.email || '',
        avatar_url: user.avatar_url
      } : undefined
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return null;
  }
} 