import { supabase } from '@/lib/supabase';
import { EventMessage, EventMessageFormInput } from '@/types/event';

export async function getMessagesByEvent(eventId: string): Promise<EventMessage[]> {
  try {
    // Buscar mensagens do evento com dados do usuário
    const { data: messages, error } = await supabase
      .from('event_messages')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          username,
          email,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Converter mensagens para o formato esperado
    return messages.map(message => ({
      id: message.id,
      event_id: message.event_id,
      user_id: message.user_id,
      user_name: message.user?.first_name || message.user?.username || 'Usuário',
      user_avatar: message.user?.avatar_url || null,
      content: message.content,
      created_at: message.created_at
    }));
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
  try {
    const { data, error } = await supabase
      .from('event_messages')
      .insert({
        event_id: eventId,
        user_id: userId,
        content: message.content
      })
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          username,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    if (!data) throw new Error('No data returned after sending message');

    return {
      id: data.id,
      event_id: data.event_id,
      user_id: data.user_id,
      user_name: data.user?.first_name || data.user?.username || 'Usuário',
      user_avatar: data.user?.avatar_url || null,
      content: data.content,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
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
      async (payload) => {
        try {
          // Buscar a mensagem completa com dados do usuário
          const { data: message, error } = await supabase
            .from('event_messages')
            .select(`
              *,
              user:user_id (
                id,
                first_name,
                username,
                email,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching complete message:', error);
            return;
          }

          if (!message) return;

          // Converter para o formato esperado e chamar o callback
          callback({
            id: message.id,
            event_id: message.event_id,
            user_id: message.user_id,
            user_name: message.user?.first_name || message.user?.username || 'Usuário',
            user_avatar: message.user?.avatar_url || null,
            content: message.content,
            created_at: message.created_at
          });
        } catch (error) {
          console.error('Error processing realtime message:', error);
        }
      }
    )
    .subscribe();
} 