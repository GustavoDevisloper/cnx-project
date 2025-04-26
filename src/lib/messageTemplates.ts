/**
 * Arquivo com templates de mensagens para uso no WhatsApp
 */
import { EMOJI } from './emojiUtils';

// Template para mensagem de aviso sobre devocional
export const DevotionalMessage = (userName: string = ''): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  
  return `${greeting} 

${EMOJI.BOOK} *Devocional Semanal* 
Gostaria de convidar você para nosso devocional desta semana. Teremos um momento especial de reflexão e compartilhamento da Palavra.

${EMOJI.ALARM} *Programação da Semana*:
- Segunda: Estudo Bíblico às 19h30
- Quarta: Culto de Oração às 20h
- Domingo: Celebração às 18h

${EMOJI.PRAY} Se precisar conversar ou tiver alguma dúvida, estamos à disposição!

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para mensagem de evento
export const EventMessage = (
  userName: string = '',
  eventTitle: string = 'Evento Especial',
  eventDate: string = 'em breve',
  eventLocation: string = 'nossa igreja'
): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  
  return `${greeting}

${EMOJI.PARTY} *${eventTitle}* ${EMOJI.PARTY}

Temos um evento especial chegando e queremos que você participe!

${EMOJI.CALENDAR} *Data*: ${eventDate}
${EMOJI.PIN} *Local*: ${eventLocation}

Será um momento incrível de comunhão. Contamos com sua presença!

${EMOJI.BELL} *Lembre-se de confirmar sua participação*

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para mensagem de boas-vindas
export const WelcomeMessage = (userName: string = ''): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  
  return `${greeting}

${EMOJI.PARTY} *Bem-vindo(a) à Conexão Jovem!* ${EMOJI.PARTY}

Estamos muito felizes por você fazer parte da nossa comunidade. Aqui você encontrará:

${EMOJI.PRAY} Devocionais diários
${EMOJI.PEOPLE} Uma comunidade acolhedora
${EMOJI.BOOKS} Recursos para crescimento espiritual
${EMOJI.MUSIC} Playlists inspiradoras

Fique à vontade para explorar nosso aplicativo e participar das nossas atividades.

Que Deus abençoe sua jornada conosco!

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para mensagem de aniversário
export const BirthdayMessage = (
  userName: string = '',
  age: string = ''
): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  const ageText = age ? ` pelos seus ${age} anos` : '';
  
  return `${greeting}

${EMOJI.CAKE} *Feliz Aniversário${ageText}!* ${EMOJI.PARTY}

Em nome de toda a equipe da Conexão Jovem, queremos desejar a você um dia maravilhoso cheio de alegrias e bênçãos!

"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te conceda graça; o Senhor volte para ti o seu rosto e te dê paz." - Números 6:24-26

${EMOJI.PRAY} Que este novo ciclo seja repleto de conquistas, saúde e a presença de Deus em cada momento.

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para mensagem personalizada simples
export const CustomMessage = (
  message: string = 'Temos um recado importante para você.',
  userName: string = ''
): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  
  return `${greeting}

${message}

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para mensagem de lembrete de compromisso
export const ReminderMessage = (
  userName: string = '',
  eventName: string = 'compromisso',
  eventDate: string = 'amanhã',
  eventTime: string = '',
  additionalInfo: string = ''
): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  const timeInfo = eventTime ? ` às ${eventTime}` : '';
  
  return `${greeting}

${EMOJI.ALARM} *Lembrete: ${eventName}* ${EMOJI.ALARM}

Não se esqueça do seu ${eventName} ${eventDate}${timeInfo}.

${additionalInfo ? `${EMOJI.INFO} *Informações adicionais*: ${additionalInfo}\n\n` : ''}
Estamos esperando por você!

Conexão Jovem ${EMOJI.DOVE}`;
};

// Template para anúncios e comunicados importantes
export const AnnouncementMessage = (
  userName: string = '',
  title: string = 'Comunicado Importante',
  body: string = '',
  callToAction: string = ''
): string => {
  const greeting = userName ? `Olá ${userName}!` : 'Olá!';
  
  return `${greeting}

${EMOJI.MEGAPHONE} *${title}* ${EMOJI.MEGAPHONE}

${body}

${callToAction ? `${EMOJI.SPARKLES} *${callToAction}*\n\n` : ''}
Para mais informações, entre em contato conosco.

Conexão Jovem ${EMOJI.DOVE}`;
}; 