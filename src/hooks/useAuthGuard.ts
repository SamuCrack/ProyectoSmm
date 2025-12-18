import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuthGuard = (requiredRole?: 'admin' | 'user') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        navigate(requiredRole === 'admin' ? '/admin/login' : '/client/login');
        return;
      }
      
      // Verify role if required
      if (requiredRole) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
          
        if (roleData?.role !== requiredRole) {
          toast.error("No tienes permisos para acceder a esta página");
          navigate('/');
        }
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          toast.info("Tu sesión ha finalizado");
          navigate(requiredRole === 'admin' ? '/admin/login' : '/client/login');
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [navigate, requiredRole]);
};
