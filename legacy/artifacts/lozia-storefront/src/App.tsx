import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { BagDrawer, Footer, Header, WhatsAppFloat } from '@/components/lozia-shell';
import { useBag } from '@/hooks/use-store';
import {
  AboutPage,
  CheckoutPage,
  ContactSection,
  HomePage,
  ProductPage,
  ShopPage,
  SizeGuidePage,
} from '@/pages/storefront-pages';
import { ContactPage, PolicyPage } from '@/pages/info-pages';
import AdminPage from '@/pages/admin-page';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const bag = useBag();
  const [location] = useLocation();
  if (location.startsWith('/admin')) {
    return (
      <RoutedErrorBoundary>
        <AdminPage />
      </RoutedErrorBoundary>
    );
  }
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <div className="grain min-h-[100dvh]">
        <Header bag={bag} />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/shop/:slug">
            {(params) => <ProductPage slug={params.slug} />}
          </Route>
          <Route path="/about" component={AboutPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-confirmed">
            {() => <main className="mx-auto max-w-[900px] px-5 py-20 md:px-10 md:py-32"><span className="mono text-[hsl(var(--accent))]">LOZIA information</span><h1 className="serif mt-5 text-6xl md:text-8xl">Order confirmed.</h1><p className="mt-7 max-w-[600px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">Your order is in our hands. We are verifying your transfer now and will write to you with the next step.</p></main>}
          </Route>
          <Route path="/size-guide" component={SizeGuidePage} />
          <Route path="/shipping">
            {() => <PolicyPage kind="shipping" />}
          </Route>
          <Route path="/returns">
            {() => <PolicyPage kind="returns" />}
          </Route>
          <Route path="/privacy">
            {() => <PolicyPage kind="privacy" />}
          </Route>
          <Route path="/contact" component={ContactPage} />
          <Route component={NotFound} />
        </Switch>
        {location.startsWith('/about') && <ContactSection />}
        <Footer />
        <BagDrawer bag={bag} />
        <WhatsAppFloat />
      </div>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
