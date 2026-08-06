import {
    BrowserRouter,
    Route,
    Routes,
    Navigate
} from "react-router";

import Login from "./pages/Login";
import Home from "./pages/Home";
import StartJourneyPage from "./pages/StartJourneyPage"
import InspectionDetailPage from "./pages/InspectionDetailPage";
import InspectionAnswerDetailPage from "./pages/InspectionAnswerDetailPage";
import RegisterTripPage from "./pages/RegisterTripPage";
import CheckoutJourneyPage from "./pages/CheckoutJourneyPage";
import FuelRegistrationPage from "./pages/FuelRegistrationPage";
import TripIncidentPage from "./pages/TripIncidentPage";
import AccidentReportedPage from "./pages/AccidentReportedPage";
import NotificationsPage from "./pages/NotificationsPage";
import AccidentFormPage from "./pages/AccidentFormPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import ConsultationListPage from "./pages/ConsultationListPage";
import ConsultationDetailPage from "./pages/ConsultationDetailPage";
import SupervisorDashboardPage from "./pages/SupervisorDashboardPage";
import SupervisorCreateUserPage from "./pages/SupervisorCreateUserPage";
import RoleRoute from "./components/auth/RoleRoute";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />}/>
                <Route path="/home" element={<RoleRoute allowedRoles={["Conductor"]}><Home /></RoleRoute>} />
                <Route path="/supervisor" element={<RoleRoute allowedRoles={["Supervisor", "Administrador"]}><SupervisorDashboardPage /></RoleRoute>} />
                <Route path="/supervisor/users/new" element={<RoleRoute allowedRoles={["Supervisor", "Administrador"]}><SupervisorCreateUserPage /></RoleRoute>} />
                <Route path="/StartJourneyPage" element={<StartJourneyPage/> }/>
                <Route path="/inspections/:inspectionId" element={<InspectionDetailPage />} />
                <Route path="/inspections/:inspectionId/answers/:answerId" element={<InspectionAnswerDetailPage />} />
                <Route path="/trips/register" element={<RegisterTripPage />} />
                <Route path="/journey/checkout" element={<CheckoutJourneyPage />} />
                <Route path="/fuel" element={<FuelRegistrationPage />} />
                <Route path="/trip-incidents/new" element={<TripIncidentPage />} />
                <Route path="/accidents/reported/:accidentId" element={<AccidentReportedPage />} />
                <Route path="/accidents/:accidentId/complete" element={<AccidentFormPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/consultations" element={<ConsultationsPage />} />
                <Route path="/consultations/:category" element={<ConsultationListPage />} />
                <Route path="/consultations/:category/:id" element={<ConsultationDetailPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
