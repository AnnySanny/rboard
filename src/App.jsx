import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

// Звичайні імпорти
import Home from "./pages/public/Home";
import ProtectedAdminRoute from "./components/protectedRoute/ProtectedAdminRoute";
import ProtectedPartnerRoute from "./components/protectedRoute/ProtectedPartnerRoute";
import { ChatNotificationsProvider } from "./context/ChatNotificationsContext";
import UserPresenceTracker from "./components/system/UserPresenceTracker";
import UserAccessWatcher from "./components/system/UserAccessWatcher";
import NetworkStatus from "./components/system/NetworkStatus";
import AdminRealEstateEdit from "./pages/admin/AdminRealEstateEdit";
import PageSEO from "./components/seo/PageSEO";
// Публічні сторінки
const About = lazy(() =>
  import("./pages/public/About")
);
const Partners = lazy(() =>
  import("./pages/public/Partners")
);
const Contacts = lazy(() =>
  import("./pages/public/Contacts")
);

const AdminLogin = lazy(() =>
  import("./pages/auth/AdminLogin")
);

const AccessDenied = lazy(() =>
  import("./pages/errors/AccessDenied")
);
const NotFound = lazy(() =>
  import("./pages/errors/NotFound")
);
const CreateListing = lazy(() =>
  import("./pages/listings/CreateListing")
);

const Rules = lazy(() =>
  import("./pages/public/Rules")
);

const Help = lazy(() =>
  import("./pages/public/Help")
);
const Fundraisers = lazy(() =>
  import("./pages/public/Fundraisers")
);
// Сторінки користувача
const UserHome = lazy(() =>
  import("./pages/user/UserHome")
);

const UserListings = lazy(() =>
  import("./pages/user/UserListings")
);
const UserChats = lazy(() =>
  import("./pages/user/UserChats")
);
const UserProfile = lazy(() =>
  import("./pages/user/UserProfile")
);
const UserSettings = lazy(() =>
  import("./pages/user/UserSettings")
);

const EditListing = lazy(() =>
  import("./pages/user/EditListing")
);

// Компоненти адміністративної панелі
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout")
);

// Сторінки адміністративної панелі
const Dashboard = lazy(() =>
  import("./pages/admin/Dashboard")
);

const AdminListings = lazy(() =>
  import("./pages/admin/AdminListings")
);

const AdminUsers = lazy(() =>
  import("./pages/admin/AdminUsers")
);
const AdminChats = lazy(() =>
  import("./pages/admin/AdminChats")
);
const AdminListingViews = lazy(() =>
  import("./pages/admin/AdminListingViews")
);
const AdminContacts = lazy(() =>
  import("./pages/admin/AdminContacts")
);
const AdminFundraisers = lazy(() =>
  import("./pages/admin/AdminFundraisers")
);
const AdminCreateListing = lazy(() =>
  import("./pages/admin/AdminCreateListing")
);

const AdminNews = lazy(() =>
  import("./pages/admin/AdminNews")
);

const AdminLogs = lazy(() =>
  import("./pages/admin/AdminLogs")
);

const AdminTouristPlaces = lazy(() =>
  import("./pages/admin/AdminTouristPlaces")
);

const AdminStatistics = lazy(() =>
  import("./pages/admin/AdminStatistics")
);

const AdminEditListing = lazy(() =>
  import("./pages/admin/AdminEditListing")
);

const AdminSite = lazy(() =>
  import("./pages/admin/AdminSite")
);

// Сторінки партнерів

const CreateRealEstateListing = lazy(() =>
  import("./pages/partners/CreateRealEstateListing")
);

const EditRealEstateListing = lazy(() =>
  import("./pages/partners/EditRealEstateListing")
);


const noIndexPage = (
  element,
  title,
  robots = "noindex, nofollow"
) => (
  <PageSEO
    title={`${title} | RBoard`}
    description="Службова сторінка платформи RBoard."
    robots={robots}
    canonical={false}
  >
    {element}
  </PageSEO>
);
const App = () => {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <UserAccessWatcher />
      <UserPresenceTracker />
      <ChatNotificationsProvider>
        <Suspense fallback={null}>
          <Routes>

            {/* ==============================
              ПУБЛІЧНІ СТОРІНКИ
          ============================== */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/listing/:listingId"
              element={<Home />}
            />

            <Route
              path="/category/:categorySlug"
              element={<Home />}
            />

            <Route
              path="/about"
              element={
                <PageSEO
                  title="Про RBoard — локальна дошка оголошень Рахова"
                  description="Дізнайтеся більше про RBoard — безкоштовну локальну дошку оголошень для жителів Рахова та Рахівського району."
                  path="/about"
                >
                  <About />
                </PageSEO>
              }
            />
            <Route
              path="/partners"
              element={
                <PageSEO
                  title="Наші партнери — реклама та співпраця в Рахові | RBoard"
                  description="Партнерство з RBoard для місцевого бізнесу. Пріоритетний показ оголошень, унікальний дизайн, просування та реклама в соціальних мережах."
                  path="/partners"
                >
                  <Partners />
                </PageSEO>
              }
            />
            <Route
              path="/contacts"
              element={
                <PageSEO
                  title="Контакти RBoard — зв'язок з адміністрацією"
                  description="Зв'яжіться з адміністрацією RBoard. Допомога користувачам, пропозиції, співпраця та повідомлення про проблеми на сайті."
                  path="/contacts"
                >
                  <Contacts />
                </PageSEO>
              }
            />

            <Route
              path="/rules"
              element={
                <PageSEO
                  title="Правила користування дошкою оголошень | RBoard"
                  description="Правила публікації оголошень та користування платформою RBoard. Вимоги до оголошень, модерація та безпека користувачів."
                  path="/rules"
                >
                  <Rules />
                </PageSEO>
              }
            />

            <Route
              path="/help"
              element={
                <PageSEO
                  title="Допомога та поширені запитання | RBoard"
                  description="Як зареєструватися, безкоштовно розмістити оголошення та користуватися функціями RBoard. Допомога та відповіді на поширені запитання."
                  path="/help"
                >
                  <Help />
                </PageSEO>
              }
            />
            <Route
              path="/fundraisers"
              element={
                <PageSEO
                  title="Благодійні збори Рахова та Рахівщини | RBoard"
                  description="Актуальні благодійні збори Рахова та Рахівського району. Підтримайте важливі ініціативи та долучайтеся до допомоги громаді."
                  path="/fundraisers"
                >
                  <Fundraisers />
                </PageSEO>
              }
            />
            <Route
              path="/create-listing"
              element={<CreateListing />}
            />

            <Route
              path="/admin-login"
              element={noIndexPage(
                <AdminLogin />,
                "Вхід до адміністративної панелі"
              )}
            />

            {/* Сторінка відмови в доступі */}

            <Route
              path="/403"
              element={noIndexPage(
                <AccessDenied />,
                "Доступ заборонено",
                "noindex, follow"
              )}
            />

            {/* ==============================
              СТОРІНКИ КОРИСТУВАЧА
          ============================== */}

            {/* Особистий кабінет */}
            <Route
              path="/user"
              element={noIndexPage(
                <UserHome />,
                "Особистий кабінет"
              )}
            />


            {/* Мої оголошення */}
            <Route
              path="/user/listings"
              element={noIndexPage(
                <UserListings />,
                "Мої оголошення"
              )}
            />

            {/* Чати */}
            <Route
              path="/user/chats"
              element={noIndexPage(
                <UserChats />,
                "Мої повідомлення"
              )}
            />

            {/* Власний профіль */}
            <Route
              path="/user/profile"
              element={noIndexPage(
                <UserProfile />,
                "Мій профіль"
              )}
            />
            {/* Публічний профіль за UID */}
            <Route
              path="/user/:uid"
              element={<UserProfile />}
            />

            {/* Налаштування акаунта */}
            <Route
              path="/user/settings"
              element={noIndexPage(
                <UserSettings />,
                "Налаштування акаунта"
              )}
            />

            {/* Редагування оголошення */}
            <Route
              path="/user/listings/:listingId/edit"
              element={noIndexPage(
                <EditListing />,
                "Редагування оголошення"
              )}
            />
            {/* ==============================
              СТОРІНКИ ПАРТНЕРІВ
          ============================== */}


            <Route
              path="/user/partner/create/real-estate"
              element={noIndexPage(
                <ProtectedPartnerRoute requiredType="real_estate">
                  <CreateRealEstateListing />
                </ProtectedPartnerRoute>,
                "Створення оголошення нерухомості"
              )}
            />

            <Route
              path="/user/partner/edit/real-estate/:listingId"
              element={noIndexPage(
                <ProtectedPartnerRoute partnerType="real_estate">
                  <EditRealEstateListing />
                </ProtectedPartnerRoute>,
                "Редагування оголошення нерухомості"
              )}
            />

            {/* ==============================
              ЗАХИЩЕНА АДМІН-ПАНЕЛЬ
          ============================== */}

            <Route
              path="/dashboard"
              element={noIndexPage(
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>,
                "Адміністративна панель"
              )}
            >

              {/* Головна сторінка адмін-панелі */}

              <Route
                index
                element={<Dashboard />}
              />

              {/* Керування оголошеннями */}

              <Route
                path="listings"
                element={<AdminListings />}
              />

              <Route
                path="listings/:listingId/edit"
                element={<AdminEditListing />}
              />
              <Route
                path="listings/:listingId/edit/real-estate"
                element={<AdminRealEstateEdit />}
              />
              <Route
                path="admin-create-listing"
                element={<AdminCreateListing />}
              />
              <Route
                path="users/:uid"
                element={<UserProfile adminView />}
              />
              {/* Новини */}

              <Route
                path="news"
                element={<AdminNews />}
              />

              {/* Логи */}
              {/* Збори */}

              <Route
                path="fundraisers"
                element={<AdminFundraisers />}
              />
              <Route
                path="logs"
                element={<AdminLogs />}
              />

              {/* Туристичні місця */}

              <Route
                path="tourist-places"
                element={<AdminTouristPlaces />}
              />
              <Route
                path="listing-views"
                element={<AdminListingViews />}
              />
              <Route
                path="chats"
                element={<AdminChats />}
              />
              {/* Статистика */}

              <Route
                path="statistics"
                element={<AdminStatistics />}
              />

              {/* Керування користувачами */}

              <Route
                path="users"
                element={<AdminUsers />}
              />

              {/* Головна сайту */}

              <Route
                path="site"
                element={<AdminSite />}
              />

              {/* Повідомлення з форми
                зворотного зв'язку */}

              <Route
                path="contacts"
                element={<AdminContacts />}
              />

            </Route>

            {/* ==============================
              НЕВІДОМА АДРЕСА
          ============================== */}

            <Route
              path="*"
              element={noIndexPage(
                <NotFound />,
                "Сторінку не знайдено",
                "noindex, follow"
              )}
            />

          </Routes>
        </Suspense>
      </ChatNotificationsProvider>
    </BrowserRouter>
  );
};

export default App;