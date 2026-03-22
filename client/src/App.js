import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home";
import SearchFlights from "./pages/flights";
import BookingOffer from "./pages/BookingOffer";
import BookingPassengers from "./pages/BookingPassengers";
import BookingConfirmation from "./pages/BookingConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTrips from "./pages/MyTrips";
import TripDetail from "./pages/TripDetail";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Payment from "./pages/payment";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights" element={<SearchFlights />} />
        <Route path="/booking" element={<BookingOffer />} />
        <Route path="/booking/passengers" element={<BookingPassengers />} />
        <Route path="/booking/confirmation" element={<BookingConfirmation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-trips" element={<MyTrips />} />
        <Route path="/my-trips/:id" element={<TripDetail />} />
        <Route path="/payment" element={<Payment />}/>      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
