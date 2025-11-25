import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './SeriesFlight.css';
import img2 from '../../assets/p2.png';
import img3 from '../../assets/p3.png';
import img4 from '../../assets/p4.png';
import img5 from '../../assets/p5.png';
import img6 from '../../assets/p6.png';

// Inlined SVG icons remain the same.
const FaPlaneDeparture = (props) => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M480 192H368l-64-48-32-96-32 96-64 48H32v112h144l64 48 32 96 32-96 64-48h112z"></path></svg>;

function SeriesFlight() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // State for sectors, loading status, and errors
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const row1Images = [img2, img3, img4, img5, img6];

    const sliderImages = [
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&h=1080&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1920&h=1080&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&crop=center',
    ];

    // --- API Fetching Logic ---
    useEffect(() => {
        // Function to fetch the famous sectors from the backend API
        const fetchSectors = async () => {
            try {
                // Use the configured API client to make the request
                const response = await api.get('/sectors/famous');
                const data = response.data;
                setSectors(data); // Update state with the fetched data
            } catch (error) {
                console.error("Failed to fetch sectors:", error);
                setError("Could not load flight sectors. Please try again later.");
            } finally {
                setLoading(false); // Stop loading, whether successful or not
            }
        };

        fetchSectors();
    }, []); // The empty array [] means this effect runs only once when the component mounts

    useEffect(() => {
        const interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % sliderImages.length), 5000);
        return () => clearInterval(interval);
    }, [sliderImages.length]);

    const handleSectorSelect = (flight) => {
    navigate(`/flights/${flight.fromCode}/${flight.toCode}`, {
        state: {
            flights: [flight], // Pass the selected flight as an array
            fromSeriesFlight: true // Flag to indicate navigation from SeriesFlight
        }
    });
};


    return (
        <div className="seriesFlightContainer">
            <div className="backgroundSlider">
                {sliderImages.map((image, index) => (
                    <div key={index} className={`backgroundSlide ${index === currentSlide ? 'active' : ''}`} style={{ backgroundImage: `url(${image})` }} />
                ))}
                <div className="backgroundOverlay" />
            </div>
            <header className="headerContent">
                <h1>Series Flights</h1>
            </header>

            <main className="contentArea">
                <div className="sectorSelectionCard">
                    <h2>Choose a Sector, Get the Best Fare</h2>
                    <div className="sectorGrid">
                        {/* Conditional Rendering based on loading and error states */}
                        {loading ? (
                            <p>Loading popular routes...</p>
                        ) : error ? (
                            <p className="error-message">{error}</p>
                        ) : (
                            sectors.map(sector => (
                                <button key={sector.id} className="sectorButton" onClick={() => handleSectorSelect(sector)}>
                                    <FaPlaneDeparture /> {sector.from} - {sector.to}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </main>
            <div className="gallery-container">
                <h2 className="gallery-title">Partners</h2>
                <div className="gallery-row row-left">
                    <div className="scrolling-track left-scroll">
                        {[...row1Images, ...row1Images].map((img, i) => (
                            <div className="gallery-item" key={`row1-${i}`}>
                                <img src={img} alt={`Gallery Row 1 Img ${i}`} loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeriesFlight;
