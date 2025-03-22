import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/services/authService';
import { Navigate } from 'react-router-dom';

type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
};

export default function DBSchemaCheck() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      const isAdminUser = await isAdmin();
      setHasAccess(isAdminUser);
      setLoading(false);
    };

    checkAccess();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.rpc('get_tables');
      
      if (error) {
        console.error('Erro ao buscar tabelas:', error);
        // Fallback para tabelas conhecidas
        setTables(['questions', 'events', 'users']);
      } else {
        setTables(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar tabelas:', error);
      // Fallback para tabelas conhecidas
      setTables(['questions', 'events', 'users']);
    }
  };

  const fetchTableColumns = async (table: string) => {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', table);
      
      if (error) {
        console.error(`Erro ao buscar colunas da tabela ${table}:`, error);
        setColumns([]);
      } else {
        setColumns(data || []);
      }
    } catch (error) {
      console.error(`Erro ao buscar colunas da tabela ${table}:`, error);
      setColumns([]);
    }
  };

  const fetchSampleData = async (table: string) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);
      
      if (error) {
        console.error(`Erro ao buscar dados da tabela ${table}:`, error);
        setSampleData([]);
      } else {
        setSampleData(data || []);
      }
    } catch (error) {
      console.error(`Erro ao buscar dados da tabela ${table}:`, error);
      setSampleData([]);
    }
  };

  const selectTable = async (table: string) => {
    setSelectedTable(table);
    await fetchTableColumns(table);
    await fetchSampleData(table);
  };

  useEffect(() => {
    if (hasAccess) {
      fetchTables();
    }
  }, [hasAccess]);

  if (loading) {
    return <div className="container py-10">Verificando permissões...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Verificação de Estrutura do Banco de Dados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tabelas</CardTitle>
              <CardDescription>
                Selecione uma tabela para verificar sua estrutura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tables.map(table => (
                  <Button
                    key={table}
                    variant={selectedTable === table ? "default" : "outline"}
                    className="w-full text-left justify-start"
                    onClick={() => selectTable(table)}
                  >
                    {table}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-3">
          {selectedTable ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estrutura da Tabela: {selectedTable}</CardTitle>
                  <CardDescription>
                    Colunas e tipos de dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2">Coluna</th>
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-left p-2">Nullable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((col, idx) => (
                          <tr key={idx} className="border-b border-border">
                            <td className="p-2">{col.column_name}</td>
                            <td className="p-2">{col.data_type}</td>
                            <td className="p-2">{col.is_nullable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Amostra de Dados: {selectedTable}</CardTitle>
                  <CardDescription>
                    Primeiras 5 linhas da tabela
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {sampleData.length > 0 ? (
                      <pre className="p-4 bg-muted rounded-md overflow-auto">
                        {JSON.stringify(sampleData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">Nenhum dado encontrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  Selecione uma tabela para ver sua estrutura
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 