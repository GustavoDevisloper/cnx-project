import React, { useState, useEffect } from 'react';
import WhatsAppBotSender from '@/components/WhatsAppBotSender';
import WhatsappBotStatus from '@/components/WhatsappBotStatus';
import { Card, Title, Text, Subtitle, Tab, TabGroup, TabList, TabPanel, TabPanels, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Button } from '@tremor/react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import MessageScheduler from '@/components/MessageScheduler';
import { logger } from '@/lib/utils';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/services/whatsappBotService';
import { WelcomeMessage } from '@/lib/messageTemplates';
import { ensureUnicodeEmojis } from '@/lib/emojiUtils';

interface Contact {
  id: string;
  real_name: string;
  display_name: string;
  phone: string;
}

const WhatsAppPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{phone: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Obter todos os usuários
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, real_name, display_name, phone_number')
        .order('real_name', { ascending: true });
        
      if (userError) {
        console.error('Erro ao buscar usuários:', userError);
        toast.error('Falha ao buscar usuários do banco de dados');
        setLoading(false);
        return;
      }
      
      // Converter dados de usuário para o formato de contatos
      let userContacts: Contact[] = [];
      
      if (userData && userData.length > 0) {
        // Mapear usuários para contatos
        userContacts = userData
          .map(user => ({
            id: user.id,
            real_name: user.real_name || 'Sem nome',
            display_name: user.display_name || 'Usuário',
            phone: user.phone_number || ''
          }))
          .filter(contact => contact.phone); // Apenas contatos com telefone
        
        if (userContacts.length === 0) {
          toast.warning('Não há contatos com números de telefone cadastrados');
        }
      } else {
        toast.warning('Nenhum usuário encontrado no banco de dados');
      }
      
      setContacts(userContacts);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Falha ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
    toast.success('Lista de contatos atualizada');
  };

  const handleSelectContact = (phone: string, name: string) => {
    setSelectedContact({ phone, name });
    setActiveTab(1);
  };
  
  const handleDirectWhatsApp = (phone: string, name: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone).replace('+', '');
      const message = WelcomeMessage(name);
      // Garantir que os emojis estejam em formato Unicode compatível
      const compatibleMessage = ensureUnicodeEmojis(message);
      const encodedMessage = encodeURIComponent(compatibleMessage);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast.success(`Abrindo WhatsApp para ${name}`);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Não foi possível abrir o WhatsApp');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="container p-4">
      <Title className="mb-2">Gerenciamento de WhatsApp</Title>
      <Subtitle className="mb-6">Envie e agende mensagens para os usuários da plataforma</Subtitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <WhatsappBotStatus />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <TabGroup index={activeTab} onIndexChange={setActiveTab}>
            <TabList className="mb-4">
              <Tab>Contatos</Tab>
              {selectedContact && <Tab>Configurar Mensagem</Tab>}
            </TabList>
            
            <TabPanels>              
              <TabPanel>
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      Lista de Contatos ({contacts.length})
                    </Text>
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={RefreshCw}
                      onClick={handleRefresh}
                      loading={refreshing}
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  {loading ? (
                    <div className="py-8 text-center">
                      <Text>Carregando contatos...</Text>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Text>Nenhum contato com número de telefone encontrado</Text>
                      <Text className="mt-2 text-sm text-gray-500">Verifique se os usuários possuem números de telefone cadastrados</Text>
                    </div>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Nome Real</TableHeaderCell>
                          <TableHeaderCell>Exibição</TableHeaderCell>
                          <TableHeaderCell>Telefone</TableHeaderCell>
                          <TableHeaderCell>Ações</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>{contact.real_name}</TableCell>
                            <TableCell>{contact.display_name}</TableCell>
                            <TableCell>{contact.phone}</TableCell>
                            <TableCell className="flex space-x-2">
                              <Button
                                size="xs"
                                variant="light"
                                icon={MessageSquare}
                                onClick={() => handleSelectContact(contact.phone, contact.real_name || contact.display_name)}
                                disabled={!contact.phone}
                              >
                                Configurar
                              </Button>
                              <Button
                                size="xs"
                                variant="primary"
                                color="green"
                                icon={ExternalLink}
                                onClick={() => handleDirectWhatsApp(contact.phone, contact.real_name || contact.display_name)}
                                disabled={!contact.phone}
                              >
                                Enviar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </TabPanel>
              
              {selectedContact && (
                <TabPanel>
                  <Card>
                    <WhatsAppBotSender 
                      initialRecipientPhone={selectedContact.phone} 
                      initialRecipientName={selectedContact.name} 
                    />
                  </Card>
                </TabPanel>
              )}
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage; 