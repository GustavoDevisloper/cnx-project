import React from 'react';
import { Card, Text, Callout, Metric } from '@tremor/react';
import { InfoIcon, Check, AlertTriangle } from 'lucide-react';

const WhatsappBotStatus: React.FC = () => {
  const isActive = true; // Isso poderia ser obtido de uma API real

  return (
    <Card className="mb-4">
      <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
        Status do WhatsApp Bot
      </Text>
      
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <Text>{isActive ? 'Ativo' : 'Inativo'}</Text>
      </div>

      <Callout 
        title="Serviço de Mensagens" 
        icon={isActive ? Check : AlertTriangle} 
        color={isActive ? "green" : "amber"}
        className="mb-4"
      >
        {isActive 
          ? "O serviço de envio de mensagens está funcionando normalmente." 
          : "O serviço de envio de mensagens está temporariamente indisponível."}
      </Callout>
      
      {/* <div className="mt-6">
        <Text className="mb-1">Mensagens enviadas hoje</Text>
        <Metric>26</Metric>
      </div> */}
    </Card>
  );
};

export default WhatsappBotStatus; 