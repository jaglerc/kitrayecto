import {
    BrowserRouter,
    Route,
    Routes,
    Navigate
} from "react-router";

import Login from "./pages/Login";
import Home from "./pages/Home";
import StartJourneyPage from "./pages/StartJourneyPage"
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />}/>
                <Route path="/home" element={<Home />} />
                <Route path="/StartJourneyPage" element={<StartJourneyPage/> }/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;