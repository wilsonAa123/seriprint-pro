import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  email?: string;
}

const roleLabels = {
  admin: "Administrador",
  vendedor: "Vendedor",
  diseñador: "Diseñador",
  cliente: "Cliente",
};

const roleBadgeVariants = {
  admin: "destructive",
  vendedor: "default",
  diseñador: "secondary",
  cliente: "outline",
} as const;

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUserRole();
    fetchUsers();
  }, []);

  const fetchCurrentUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      setCurrentUserRole(data?.role || null);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Create users array with emails from profiles
      const usersData = profiles?.map((profile) => ({
        ...profile,
        email: undefined as string | undefined, // Will be populated if we can access auth data
      })) || [];

      setUsers(usersData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole as 'admin' | 'vendedor' | 'diseñador' | 'cliente' })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido actualizado a ${roleLabels[newRole as keyof typeof roleLabels]}`,
      });

      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el rol del usuario",
      });
    }
  };

  const isAdmin = currentUserRole === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administra los roles y permisos de los usuarios del sistema
            </CardDescription>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  {isAdmin && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariants[user.role as keyof typeof roleBadgeVariants]}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cliente">
                              <span className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Cliente
                              </span>
                            </SelectItem>
                            <SelectItem value="diseñador">
                              <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Diseñador
                              </span>
                            </SelectItem>
                            <SelectItem value="vendedor">
                              <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Vendedor
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-destructive" />
                                Administrador
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isAdmin && (
          <div className="mt-4 p-4 bg-muted rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Permisos limitados</p>
              <p>Solo los administradores pueden modificar los roles de los usuarios.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
