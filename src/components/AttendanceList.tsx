import { useState } from 'react';
import { User, UserCheck, UserX, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EventAttendance } from '@/types/event';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AttendanceListProps {
  attendances: EventAttendance[];
}

export function AttendanceList({ attendances }: AttendanceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar participantes conforme pesquisa
  const filteredAttendances = searchTerm.trim() 
    ? attendances.filter(
        a => a.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : attendances;
  
  // Ordenar por status: confirmados primeiro, depois talvez, depois não vão
  const sortedAttendances = [...filteredAttendances].sort((a, b) => {
    const statusOrder = { 'confirmed': 0, 'maybe': 1, 'declined': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
  
  const confirmedCount = attendances.filter(a => a.status === 'confirmed').length;
  const maybeCount = attendances.filter(a => a.status === 'maybe').length;
  const declinedCount = attendances.filter(a => a.status === 'declined').length;
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'maybe': return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      case 'declined': return <UserX className="h-4 w-4 text-red-500" />;
      default: return <User className="h-4 w-4" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed': 
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmado</Badge>;
      case 'maybe': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Talvez</Badge>;
      case 'declined': 
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Não vai</Badge>;
      default: 
        return null;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm">{confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{maybeCount} talvez</span>
              </div>
              <div className="flex items-center gap-1">
                <UserX className="h-4 w-4 text-red-500" />
                <span className="text-sm">{declinedCount} não {declinedCount !== 1 ? 'vão' : 'vai'}</span>
              </div>
            </div>
            
            <Input
              placeholder="Buscar participante..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          
          {sortedAttendances.length > 0 ? (
            <ul className="divide-y">
              {sortedAttendances.map(attendance => (
                <li key={attendance.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={attendance.user_avatar} alt={attendance.user_name} />
                      <AvatarFallback>{getInitials(attendance.user_name)}</AvatarFallback>
                    </Avatar>
                    <span>{attendance.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {attendance.items && attendance.items.length > 0 && (
                      <Badge variant="secondary" className="mr-2">
                        {attendance.items.length} {attendance.items.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    )}
                    {getStatusBadge(attendance.status)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhum participante encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 