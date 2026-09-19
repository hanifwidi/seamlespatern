import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@components/ui/sonner';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-right" />
    </>
  );
}
