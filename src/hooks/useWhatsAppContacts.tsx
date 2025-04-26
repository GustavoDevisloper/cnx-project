import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { WhatsAppContact } from '@/components/WhatsAppContactsList';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export default function useWhatsAppContacts() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primeiro, verifica se há contatos salvos no localStorage
      const savedContacts = localStorage.getItem('whatsapp_contacts');
      if (savedContacts) {
        try {
          const parsed = JSON.parse(savedContacts);
          if (Array.isArray(parsed)) {
            setContacts(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Erro ao carregar contatos do localStorage:', e);
          // Se der erro no parse, continua para buscar do banco
        }
      }
      
      // Se não tiver no localStorage ou der erro, tenta buscar do banco
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        // Verificar se é apenas erro porque a tabela não existe
        if (error.code === '42P01') { // Código para "tabela não existe"
          // Usar contatos de demonstração
          const demoContacts: WhatsAppContact[] = [
            { id: '1', name: 'João Silva', phoneNumber: '5511987654321', email: 'joao@exemplo.com' },
            { id: '2', name: 'Maria Oliveira', phoneNumber: '5511912345678', email: 'maria@exemplo.com' },
            { id: '3', name: 'Pedro Santos', phoneNumber: '5511955555555' },
            { id: '4', name: 'Ana Lima', phoneNumber: '5511977777777' }
          ];
          setContacts(demoContacts);
          
          // Salvar os contatos de demonstração no localStorage
          localStorage.setItem('whatsapp_contacts', JSON.stringify(demoContacts));
        } else {
          setError(`Erro ao carregar contatos: ${error.message}`);
          console.error('Erro ao buscar contatos:', error);
        }
      } else if (data) {
        // Mapear os dados do banco para o formato de WhatsAppContact
        const formattedContacts: WhatsAppContact[] = data.map(contact => ({
          id: contact.id,
          name: contact.name || contact.display_name || '',
          phoneNumber: contact.phone_number || contact.phone || '',
          email: contact.email || undefined,
          notes: contact.notes || undefined,
          tags: contact.tags || undefined
        }));
        
        setContacts(formattedContacts);
        
        // Salvar os contatos no localStorage para acesso offline
        localStorage.setItem('whatsapp_contacts', JSON.stringify(formattedContacts));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar contatos: ${errorMessage}`);
      console.error('Erro ao carregar contatos:', err);
      
      // Em caso de erro, usar contatos de demonstração
      const demoContacts: WhatsAppContact[] = [
        { id: '1', name: 'João Silva', phoneNumber: '5511987654321', email: 'joao@exemplo.com' },
        { id: '2', name: 'Maria Oliveira', phoneNumber: '5511912345678', email: 'maria@exemplo.com' }
      ];
      setContacts(demoContacts);
      
      // Salvar os contatos de demonstração no localStorage
      localStorage.setItem('whatsapp_contacts', JSON.stringify(demoContacts));
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contact: Omit<WhatsAppContact, 'id'>): Promise<WhatsAppContact> => {
    try {
      // Gerar ID único para o novo contato
      const newContact: WhatsAppContact = {
        ...contact,
        id: uuidv4()
      };
      
      // Primeiro tentar salvar no banco de dados
      try {
        const { error } = await supabase
          .from('whatsapp_contacts')
          .insert({
            id: newContact.id,
            name: newContact.name,
            phone_number: newContact.phoneNumber,
            email: newContact.email,
            notes: newContact.notes,
            tags: newContact.tags
          });
        
        if (error && error.code !== '42P01') { // Ignorar erro se a tabela não existir
          console.error('Erro ao salvar contato no banco:', error);
        }
      } catch (dbError) {
        // Ignorar erros de banco, já que temos fallback para localStorage
        console.warn('Erro ao salvar contato no banco de dados, usando apenas localStorage:', dbError);
      }
      
      // Adicionar à lista de contatos em memória
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      
      // Atualizar localStorage
      localStorage.setItem('whatsapp_contacts', JSON.stringify(updatedContacts));
      
      toast.success(`Contato "${newContact.name}" adicionado com sucesso`);
      return newContact;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao adicionar contato: ${errorMessage}`);
      throw error;
    }
  };

  const updateContact = async (id: string, contactData: Omit<WhatsAppContact, 'id'>): Promise<WhatsAppContact> => {
    try {
      const updatedContact: WhatsAppContact = {
        ...contactData,
        id
      };
      
      // Tentar atualizar no banco de dados primeiro
      try {
        const { error } = await supabase
          .from('whatsapp_contacts')
          .update({
            name: contactData.name,
            phone_number: contactData.phoneNumber,
            email: contactData.email,
            notes: contactData.notes,
            tags: contactData.tags
          })
          .eq('id', id);
        
        if (error && error.code !== '42P01') {
          console.error('Erro ao atualizar contato no banco:', error);
        }
      } catch (dbError) {
        console.warn('Erro ao atualizar contato no banco de dados, usando apenas localStorage:', dbError);
      }
      
      // Atualizar a lista em memória
      const updatedContacts = contacts.map(contact => 
        contact.id === id ? updatedContact : contact
      );
      setContacts(updatedContacts);
      
      // Atualizar localStorage
      localStorage.setItem('whatsapp_contacts', JSON.stringify(updatedContacts));
      
      toast.success(`Contato "${updatedContact.name}" atualizado com sucesso`);
      return updatedContact;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar contato: ${errorMessage}`);
      throw error;
    }
  };

  const deleteContact = async (id: string): Promise<void> => {
    try {
      // Tentar remover do banco de dados primeiro
      try {
        const { error } = await supabase
          .from('whatsapp_contacts')
          .delete()
          .eq('id', id);
        
        if (error && error.code !== '42P01') {
          console.error('Erro ao excluir contato do banco:', error);
        }
      } catch (dbError) {
        console.warn('Erro ao excluir contato do banco de dados, usando apenas localStorage:', dbError);
      }
      
      // Encontrar o contato que será removido (para mensagem)
      const contactToDelete = contacts.find(c => c.id === id);
      
      // Remover da lista em memória
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      setContacts(updatedContacts);
      
      // Atualizar localStorage
      localStorage.setItem('whatsapp_contacts', JSON.stringify(updatedContacts));
      
      if (contactToDelete) {
        toast.success(`Contato "${contactToDelete.name}" removido com sucesso`);
      } else {
        toast.success('Contato removido com sucesso');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao remover contato: ${errorMessage}`);
      throw error;
    }
  };

  // Carregar contatos ao montar o componente
  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    refreshContacts: loadContacts,
    addContact,
    updateContact,
    deleteContact
  };
} 