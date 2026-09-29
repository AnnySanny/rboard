import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

// Публічні сторінки
import Home from "./pages/Home";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import AdminLogin from "./pages/AdminLogin";
import AccessDenied from "./pages/AccessDenied";
import CreateListing from "./pages/CreateListing";
import Rules from "./pages/Rules";
// Захист адмінських сторінок
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";


//Сторінки користувача 
import UserHome from "./pages/user/UserHome";
import UserListings from "./pages/user/UserListings";
import UserProfile from "./pages/user/UserProfile";
import EditListing from "./pages/user/EditListing";
// Компоненти адміністративної панелі
import AdminLayout from "./components/admin/AdminLayout";

// Сторінки адміністративної панелі
import Dashboard from "./pages/admin/Dashboard";
import AdminListings from "./pages/admin/AdminListings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminCreateListing from "./pages/admin/AdminCreateListing";
import AdminNews from "./pages/admin/AdminNews";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminTouristPlaces from "./pages/admin/AdminTouristPlaces";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminEditListing from "./pages/admin/AdminEditListing";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публічні сторінки */}
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/listing/:listingId"
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

        <Route
          path="/user"
          element={<UserHome />}
        />
        <Route path="/user/listings" element={<UserListings />} />
        <Route path="/user/profile" element={<UserProfile />} />
        <Route
          path="/user/listings/:listingId/edit"
          element={<EditListing />}
        />

        {/* Захищена адміністративна панель */}
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
          <Route
            path="news"
            element={<AdminNews />}
          />
          <Route
            path="logs"
            element={<AdminLogs />}
          />
          <Route
            path="tourist-places"
            element={<AdminTouristPlaces />}
          />

          <Route
            path="statistics"
            element={<AdminStatistics />}
          />
          {/* Керування користувачами */}
          <Route
            path="users"
            element={<AdminUsers />}
          />

          {/* Повідомлення з форми зворотного зв'язку */}
          <Route
            path="contacts"
            element={<AdminContacts />}
          />
        </Route>
        {/* Невідома адреса */}
        <Route
          path="*"
          element={<Home />}
        />
      </Routes>

    </BrowserRouter>
  );
};

export default App;