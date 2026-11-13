import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import type {
  CartItem,
  ConfirmationState,
  LeadInquiryRecord,
  OlympiadId,
  OrderRecord,
  PageRoute,
  RegistrationRecord,
  ShopProduct,
} from './types/olympiad';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PageTransition } from './components/MotionPrimitives';
import { HomePage } from './pages/HomePage';
import { RegistrationPage } from './pages/RegistrationPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { StructurePage } from './pages/StructurePage';
import { DatesPage } from './pages/DatesPage';
import { ShopPage } from './pages/ShopPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdmitCardPage } from './pages/AdmitCardPage';
import { NewsPage } from './pages/NewsPage';
import { SuSPage } from './pages/SuSPage';
import { ARETPage } from './pages/ARETPage';
import { FullARETPage } from './pages/FullARETPage';
import { SearchPage } from './pages/SearchPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import {
  syncInquiryToFirebase,
  syncOrderToFirebase,
  syncRegistrationToFirebase,
  validateFirebaseConnection,
} from './lib/firebase';

const STORAGE_KEYS = {
  REGISTRATIONS: 'xof_registrations_v2',
  CART: 'xof_cart_v2',
  ORDERS: 'xof_orders_v2',
  INQUIRIES: 'xof_inquiries_v2',
};

const VALID_PAGES: PageRoute[] = [
  'home',
  'registration',
  'syllabus',
  'structure',
  'dates',
  'shop',
  'checkout',
  'admit-card',
  'news',
  'sus',
  'aret',
  'aret-full',
  'search',
  'confirmation',
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getPageFromHash(): PageRoute {
  const cleaned = window.location.hash.replace(/^#\/?/, '').trim() as PageRoute;
  if (VALID_PAGES.includes(cleaned)) {
    return cleaned;
  }
  return 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => getPageFromHash());
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(() =>
    readStorage<RegistrationRecord[]>(STORAGE_KEYS.REGISTRATIONS, [])
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.CART, [])
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    readStorage<OrderRecord[]>(STORAGE_KEYS.ORDERS, [])
  );
  const [inquiries, setInquiries] = useState<LeadInquiryRecord[]>(() =>
    readStorage<LeadInquiryRecord[]>(STORAGE_KEYS.INQUIRIES, [])
  );

  const [preselectedOlympiadId, setPreselectedOlympiadId] = useState<OlympiadId | null>(
    null
  );
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    void validateFirebaseConnection();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    } catch {
      // Ignore storage quota errors
    }
  }, [registrations]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [orders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    } catch {
      // Ignore storage quota errors
    }
  }, [inquiries]);

  const navigateTo = useCallback((page: PageRoute) => {
    setCurrentPage(page);
    const nextHash = page === 'home' ? '#/' : `#/${page}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleSelectOlympiadForRegistration = useCallback(
    (id: OlympiadId) => {
      setPreselectedOlympiadId(id);
      navigateTo('registration');
    },
    [navigateTo]
  );

  const handleAddToCart = (product: ShopProduct) => {
    if (!product.available) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleRegistrationComplete = async (
    record: RegistrationRecord,
    nextConfirmation: ConfirmationState
  ) => {
    const [serverResult, firebaseResult] = await Promise.allSettled([
      fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }),
      syncRegistrationToFirebase(record),
    ]);

    const serverSaved =
      serverResult.status === 'fulfilled' && serverResult.value.ok;
    const serverError =
      serverResult.status === 'rejected'
        ? 'Network request failed'
        : !serverResult.value.ok
          ? `Server returned ${serverResult.value.status}`
          : undefined;

    const firebaseSynced =
      firebaseResult.status === 'fulfilled' && firebaseResult.value.synced;
    const firebaseError =
      firebaseResult.status === 'fulfilled'
        ? firebaseResult.value.error
        : firebaseResult.reason instanceof Error
          ? firebaseResult.reason.message
          : String(firebaseResult.reason);

    if (!firebaseSynced) {
      throw new Error(firebaseError || 'Firebase Firestore submission failed.');
    }

    setRegistrations((prev) => [record, ...prev]);
    setConfirmation({
      ...nextConfirmation,
      persistenceStatus: {
        serverSaved,
        firebaseSynced,
        serverError,
        firebaseError,
      },
    });
    navigateTo('confirmation');
  };

  const handleCheckoutComplete = async (
    order: OrderRecord,
    nextConfirmation: ConfirmationState
  ) => {
    const [serverResult, firebaseResult] = await Promise.allSettled([
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      }),
      syncOrderToFirebase(order),
    ]);

    const serverSaved =
      serverResult.status === 'fulfilled' && serverResult.value.ok;
    const serverError =
      serverResult.status === 'rejected'
        ? 'Network request failed'
        : !serverResult.value.ok
          ? `Server returned ${serverResult.value.status}`
          : undefined;

    const firebaseSynced =
      firebaseResult.status === 'fulfilled' && firebaseResult.value.synced;
    const firebaseError =
      firebaseResult.status === 'fulfilled'
        ? firebaseResult.value.error
        : firebaseResult.reason instanceof Error
          ? firebaseResult.reason.message
          : String(firebaseResult.reason);

    if (!firebaseSynced) {
      throw new Error(firebaseError || 'Firebase Firestore submission failed.');
    }

    setOrders((prev) => [order, ...prev]);
    setConfirmation({
      ...nextConfirmation,
      persistenceStatus: {
        serverSaved,
        firebaseSynced,
        serverError,
        firebaseError,
      },
    });
    setCartItems([]);
    navigateTo('confirmation');
  };

  const handleInquirySaved = async (inquiry: LeadInquiryRecord): Promise<void> => {
    const firebaseResult = await syncInquiryToFirebase(inquiry);
    if (!firebaseResult.synced) {
      throw new Error(firebaseResult.error || 'Firebase Firestore submission failed.');
    }
    setInquiries((prev) => [inquiry, ...prev]);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#06080D] text-[#F1F5F9]">
        <Navbar
          currentPage={currentPage}
          cartItemCount={cartItemCount}
          onNavigate={navigateTo}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <PageTransition key={currentPage} routeKey={currentPage}>
              {currentPage === 'home' && (
                <HomePage
                  registeredCount={registrations.length}
                  cartItemCount={cartItemCount}
                  onNavigate={navigateTo}
                  onSelectOlympiadForRegistration={handleSelectOlympiadForRegistration}
                />
              )}

              {currentPage === 'registration' && (
                <RegistrationPage
                  preselectedOlympiadId={preselectedOlympiadId}
                  registrations={registrations}
                  onNavigate={navigateTo}
                  onRegistrationComplete={handleRegistrationComplete}
                />
              )}

              {currentPage === 'syllabus' && (
                <SyllabusPage
                  onNavigate={navigateTo}
                  onSelectOlympiadForRegistration={handleSelectOlympiadForRegistration}
                />
              )}

              {currentPage === 'structure' && (
                <StructurePage
                  onNavigate={navigateTo}
                  onSelectOlympiadForRegistration={handleSelectOlympiadForRegistration}
                />
              )}

              {currentPage === 'dates' && (
                <DatesPage
                  onNavigate={navigateTo}
                  onSelectOlympiadForRegistration={handleSelectOlympiadForRegistration}
                />
              )}

              {currentPage === 'shop' && (
                <ShopPage
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onNavigate={navigateTo}
                />
              )}

              {currentPage === 'checkout' && (
                <CheckoutPage
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onNavigate={navigateTo}
                  onCheckoutComplete={handleCheckoutComplete}
                />
              )}

              {currentPage === 'admit-card' && <AdmitCardPage onNavigate={navigateTo} />}

              {currentPage === 'news' && (
                <NewsPage
                  registrations={registrations}
                  orders={orders}
                  onNavigate={navigateTo}
                />
              )}

              {currentPage === 'sus' && <SuSPage onNavigate={navigateTo} />}

              {currentPage === 'aret' && (
                <ARETPage
                  onNavigate={navigateTo}
                  onInquirySaved={handleInquirySaved}
                />
              )}

              {currentPage === 'aret-full' && (
                <FullARETPage onNavigate={navigateTo} />
              )}

              {currentPage === 'search' && (
                <SearchPage
                  onNavigate={navigateTo}
                  onSelectOlympiadForRegistration={handleSelectOlympiadForRegistration}
                />
              )}

              {currentPage === 'confirmation' && (
                <ConfirmationPage confirmation={confirmation} onNavigate={navigateTo} />
              )}
            </PageTransition>
          </AnimatePresence>
        </main>

        <Footer onNavigate={navigateTo} />
      </div>
    </MotionConfig>
  );
}
