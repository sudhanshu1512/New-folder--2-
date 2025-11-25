import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/Loginpage.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import PrivateRoute from './components/Routes/PrivateRoute';
import Inventory from './components/Inventory/Inventory';
import AddNewInventoryy from './components/AddNewInventoryy/AddNewInventoryy';
import PublicRoute from './components/Routes/PublicRoute';
import Registration from './components/Registration/Registration';
import SupplierList from './components/SupplierList/SupplierList';
import SupplierTicket from './components/SupplierTicket/SupplierTicket';
import SupplierLedger from './components/SupplierLedger/SupplierLedger';
import VenderList from './components/VenderList/VenderList.jsx';
import MyProfile from './components/MyProfile/MyProfile';
import SeriesFlight from './components/SeriesFlight/SeriesFlight';
import FlightResults from './components/Flight_result/Flight_result';
import FlightSearch from './components/FlightSearch/FlightSearch';
import Contact from './components/Contact/Contact';
import Booking_page from './components/Booking_page/Booking_page';
import BookingSearch from './components/BookingSearch/BookingSearch';
import Hotelbooking from './components/HotelBooking/Hotelbooking';
import EditInventoryModal from './components/Inventory/EditInventoryModal'; 
import BookingDetails from './components/BookingSearch/BookingDetails';
import Aboutus from './components/Aboutus/Aboutus';
import Querypage from './components/Querypage/Querypage';
import Disclaimer from './components/Disclaimer/Disclaimer';
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy.jsx';
import Termsconditions from './components/Termscondition/Termscondition';

export default function App() {
  const { currentUser } = useAuth();



  return (
    <div>
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Registration /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
        <Route path="/aboutus" element={<PublicRoute><Aboutus /></PublicRoute>} />
        <Route path="/query" element={<PublicRoute><Querypage /></PublicRoute>} />
        <Route path="/disclaimer" element={<PublicRoute><Disclaimer /></PublicRoute>} />
        <Route path="/privacy-policy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
        <Route path="/terms-conditions" element={<PublicRoute><Termsconditions /></PublicRoute>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          }
        />

        <Route
          path="/add-new-inventory"
          element={
            <PrivateRoute>
              <AddNewInventoryy />
            </PrivateRoute>
          }
        />

        <Route
          path="/edit-inventory/:id"
          element={
            <PrivateRoute>
              <EditInventoryModal />
            </PrivateRoute>
          }
        />

        

        <Route
          path="/supplier-list"
          element={
            <PrivateRoute>
              <SupplierList />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier-ticket"
          element={
            <PrivateRoute>
              <SupplierTicket />
            </PrivateRoute>
          }
        />
        <Route
          path="/supplier-ledger"
          element={
            <PrivateRoute>
              <SupplierLedger />
            </PrivateRoute>
          }
        />
        <Route
          path="/vender-list"
          element={
            <PrivateRoute>
              <VenderList />
            </PrivateRoute>
          }
        />

        <Route
          path="/series-flight"
          element={
            <PrivateRoute>
              <SeriesFlight />
            </PrivateRoute>
          }
        />

        <Route
          path="/flight-search"
          element={
            <PrivateRoute>
              <FlightSearch />
            </PrivateRoute>
          }
        />

        <Route
          path="/flights/:fromCode/:toCode"
          element={
            <PrivateRoute>
              <FlightResults />
            </PrivateRoute>
          }
        />

        <Route
          path="/quote/:quoteId"
          element={
            <PrivateRoute>
              <Booking_page />
            </PrivateRoute>
          }
        />

        <Route
          path="/booking-search"
          element={
            <PrivateRoute>
              <BookingSearch />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking-details/:bookingId"
          element={
            <PrivateRoute>
              <BookingDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <PrivateRoute>
              <MyProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/hotel-search"
          element={
            <PrivateRoute>
              <Hotelbooking />
            </PrivateRoute>
          }
        />

        {/* Redirect root to login or dashboard based on auth status */}
        <Route
          path="/"
          element={
            currentUser ?
              <Navigate to="/flight-search" replace /> :
              <Navigate to="/login" replace />
          }
        />

        {/* 404 - Not Found */}
        <Route
          path="*"
          element={
            currentUser ?
              <Navigate to="/flight-search" replace /> :
              <Navigate to="/login" replace />
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}