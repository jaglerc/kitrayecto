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
            </Routes>
        </BrowserRouter>
    );
}

export default App;
