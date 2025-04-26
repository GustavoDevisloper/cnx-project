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
  first_name: string;
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
        .select('id, first_name, display_name, phone_number')
        .order('first_name', { ascending: true });
        
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
            first_name: user.first_name || 'Sem nome',
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
    <div className="container p-2 sm:p-4">
      <Title className="mb-2 text-xl sm:text-2xl">Gerenciamento de WhatsApp</Title>
      <Subtitle className="mb-4 sm:mb-6 text-sm sm:text-base">Envie e agende mensagens para os usuários da plataforma</Subtitle>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1">
          <WhatsappBotStatus />
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <TabGroup index={activeTab} onIndexChange={setActiveTab}>
            <TabList className="mb-4 overflow-x-auto flex whitespace-nowrap">
              <Tab>Contatos</Tab>
              {selectedContact && <Tab>Configurar Mensagem</Tab>}
            </TabList>
            
            <TabPanels>              
              <TabPanel>
                <Card>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
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
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell className="whitespace-nowrap">Nome</TableHeaderCell>
                            <TableHeaderCell className="whitespace-nowrap hidden sm:table-cell">Exibição</TableHeaderCell>
                            <TableHeaderCell className="whitespace-nowrap">Telefone</TableHeaderCell>
                            <TableHeaderCell className="whitespace-nowrap">Ações</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                              <TableCell className="whitespace-nowrap">{contact.first_name}</TableCell>
                              <TableCell className="whitespace-nowrap hidden sm:table-cell">{contact.display_name}</TableCell>
                              <TableCell className="whitespace-nowrap text-xs sm:text-sm">{contact.phone}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                  <Button
                                    size="xs"
                                    variant="light"
                                    icon={MessageSquare}
                                    onClick={() => handleSelectContact(contact.phone, contact.first_name || contact.display_name)}
                                    disabled={!contact.phone}
                                    className="text-xs px-1 py-1 sm:px-2"
                                  >
                                    <span className="hidden sm:inline">Configurar</span>
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="primary"
                                    color="green"
                                    icon={ExternalLink}
                                    onClick={() => handleDirectWhatsApp(contact.phone, contact.first_name || contact.display_name)}
                                    disabled={!contact.phone}
                                    className="text-xs px-1 py-1 sm:px-2"
                                  >
                                    <span className="hidden sm:inline">Enviar</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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