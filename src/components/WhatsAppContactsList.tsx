import React, { useState } from 'react';
import { Card, TextInput, Button } from '@tremor/react';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

export interface WhatsAppContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

interface WhatsAppContactsListProps {
  contacts: WhatsAppContact[];
  onSelectContact: (contact: WhatsAppContact) => void;
}

const WhatsAppContactsList: React.FC<WhatsAppContactsListProps> = ({ 
  contacts, 
  onSelectContact 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredContacts = contacts.filter(
    contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <TextInput
          icon={MagnifyingGlassIcon}
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-y-auto flex-grow rounded-md border border-gray-200">
        {filteredContacts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <li 
                key={contact.id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <UserIcon className="h-12 w-12 text-gray-300 mb-2" />
            {searchTerm ? (
              <p className="text-sm text-gray-500">Nenhum contato encontrado para "{searchTerm}"</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">Nenhum contato disponível</p>
                <p className="text-xs text-gray-400 mt-1">Adicione contatos para enviar mensagens</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppContactsList; 