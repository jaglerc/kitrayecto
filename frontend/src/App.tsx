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
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />}/>
                <Route path="/home" element={<Home />} />
                <Route path="/StartJourneyPage" element={<StartJourneyPage/> }/>
                <Route path="/inspections/:inspectionId" element={<InspectionDetailPage />} />
                <Route path="/inspections/:inspectionId/answers/:answerId" element={<InspectionAnswerDetailPage />} />
                <Route path="/trips/register" element={<RegisterTripPage />} />
                <Route path="/journey/checkout" element={<CheckoutJourneyPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
