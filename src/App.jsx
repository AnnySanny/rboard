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
import Home from "./pages/Home";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Публічні сторінки
const About = lazy(() =>
  import("./pages/About")
);

const Contacts = lazy(() =>
  import("./pages/Contacts")
);

const AdminLogin = lazy(() =>
  import("./pages/AdminLogin")
);

const AccessDenied = lazy(() =>
  import("./pages/AccessDenied")
);

const CreateListing = lazy(() =>
  import("./pages/CreateListing")
);

const Rules = lazy(() =>
  import("./pages/Rules")
);

const Help = lazy(() =>
  import("./pages/Help")
);

// Сторінки користувача
const UserHome = lazy(() =>
  import("./pages/user/UserHome")
);

const UserListings = lazy(() =>
  import("./pages/user/UserListings")
);

const UserProfile = lazy(() =>
  import("./pages/user/UserProfile")
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

const AdminContacts = lazy(() =>
  import("./pages/admin/AdminContacts")
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

const App = () => {
  return (
    <BrowserRouter>
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
            element={<About />}
          />

          <Route
            path="/contacts"
            element={<Contacts />}
          />

          <Route
            path="/rules"
            element={<Rules />}
          />

          <Route
            path="/help"
            element={<Help />}
          />

          <Route
            path="/create-listing"
            element={<CreateListing />}
          />

          <Route
            path="/admin-login"
            element={<AdminLogin />}
          />

          {/* Сторінка відмови в доступі */}

          <Route
            path="/403"
            element={<AccessDenied />}
          />

          {/* ==============================
              СТОРІНКИ КОРИСТУВАЧА
          ============================== */}

          <Route
            path="/user"
            element={<UserHome />}
          />

          <Route
            path="/user/listings"
            element={<UserListings />}
          />

          <Route
            path="/user/profile"
            element={<UserProfile />}
          />

          <Route
            path="/user/listings/:listingId/edit"
            element={<EditListing />}
          />

          {/* ==============================
              ЗАХИЩЕНА АДМІН-ПАНЕЛЬ
          ============================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
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
              path="admin-create-listing"
              element={<AdminCreateListing />}
            />

            {/* Новини */}

            <Route
              path="news"
              element={<AdminNews />}
            />

            {/* Логи */}

            <Route
              path="logs"
              element={<AdminLogs />}
            />

            {/* Туристичні місця */}

            <Route
              path="tourist-places"
              element={<AdminTouristPlaces />}
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
            element={<Home />}
          />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;