import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './Hotelbooking.module.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaSearch } from 'react-icons/fa';

const dummyHotels = [
    {
        id: 1,
        name: 'The Grand Hyatt',
        location: 'Goa',
        price: 15000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500'
    },
    {
        id: 1,
        name: 'The Grand Hyatt',
        location: 'Goa',
        price: 15000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500'
    },
    {
        id: 1,
        name: 'The Grand Hyatt',
        location: 'Goa',
        price: 15000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500'
    },
    {
        id: 1,
        name: 'The Grand Hyatt',
        location: 'Goa',
        price: 15000,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=500'
    },
    {
        id: 2,
        name: 'The Taj Mahal Palace',
        location: 'Mumbai',
        price: 25000,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500'
    },
    {
        id: 3,
        name: 'The Oberoi',
        location: 'New York',
        price: 35000,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbb5eb?w=500'
    },
    {
        id: 4,
        name: 'The Leela Palace',
        location: 'New York',
        price: 30000,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500'
    }
];

const FeaturedDestinationCard = ({ image, title, description }) => (
    <div className={styles.card}>
        <img src={image} alt={title} />
        <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
        </div>
    </div>
);

const DealCard = ({ image, title, description }) => (
    <div className={styles.card}>
        <img src={image} alt={title} />
        <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
        </div>
    </div>
);


const galleryImages = [
    { src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=500', alt: 'Guest enjoying the pool' },
    { src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500', alt: 'Luxury hotel room' },
    { src: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=500', alt: 'Couple on a holiday' },
    { src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500', alt: 'Hotel exterior' },
    { src: 'https://images.unsplash.com/photo-1445019980597-93e0951a1b3c?w=500', alt: 'Fine dining at the hotel' },
];

const gallerySettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '40px',
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 2,
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 1,
                centerPadding: '20px',
            }
        }
    ]
};

const sliderImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
    'https://images.unsplash.com/photo-1444201997210-4d85b17d35c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80'
];

function Hotelbooking() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % sliderImages.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, []);
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        const results = dummyHotels.filter(hotel =>
            destination && hotel.location.toLowerCase().includes(destination.toLowerCase())
        );
        console.log('Search results:', results); // Debugging log
        setSearchResults(results);
        setHasSearched(true); // Set that a search has been performed
    };

    return (
        <div className={styles.hotelBookingPage}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.slider}>
                    {sliderImages.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Slider image ${index + 1}`}
                            className={`${styles.sliderImage} ${index === currentImageIndex ? styles.active : ''}`}
                        />
                    ))}
                </div>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Find Your Perfect Stay</h1>
                    <p className={styles.heroSubtitle}>Book from over 1 million hotels and homes worldwide.</p>
                </div>
            </section>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <div className={styles.inputGroup}>
                        <label><FaMapMarkerAlt /> destination</label>
                        <input
                            type="text"
                            placeholder="e.g. New York, Goa"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label><FaCalendarAlt /> Check-in</label>
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label><FaCalendarAlt /> Check-out</label>
                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label><FaUserFriends /> Guests</label>
                        <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                            {[...Array(10).keys()].map(i => (
                                <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className={styles.searchButton}><FaSearch /></button>
                </form>
            </div>

            {/* Search Results Section */}
            {hasSearched && (
                <section className={styles.searchResults}>
                    <h2 className={styles.sectionTitle}>Search Results</h2>
                    {searchResults.length > 0 ? (
                        searchResults.map(hotel => (
                            <div key={hotel.id} className={styles.hotelCard}>
                                <img src={hotel.image} alt={hotel.name} className={styles.hotelImage} />
                                <div className={styles.hotelInfo}>
                                    <div>
                                        <h3 className={styles.hotelName}>{hotel.name}</h3>
                                        <p className={styles.hotelLocation}>{hotel.location}</p>
                                    </div>
                                    <div className={styles.hotelDetails}>
                                        <p className={styles.hotelPrice}>₹{hotel.price.toLocaleString()}/night</p>
                                        <p className={styles.hotelRating}>⭐ {hotel.rating}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No hotels found for "{destination}". Please try another search.</p>
                    )}
                </section>
            )}


            {/* FeaturedDestinations Section */}
            <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>FeaturedDestinations</h2>
                <div className={styles.cardsContainer}>
                    <FeaturedDestinationCard
                        image="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500"
                        title="Beachside Resorts"
                        description="Relax and unwind at our stunning beachside locations."
                    />
                    <FeaturedDestinationCard
                        image="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500"
                        title="City Center Hotels"
                        description="Stay in the heart of the action with our central city hotels."
                    />
                    <FeaturedDestinationCard
                        image="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500"
                        title="Luxury Villas"
                        description="Experience ultimate comfort and privacy in our luxury villas."
                    />
                </div>
            </section>

            {/* Exclusive Deals Section */}
            <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Exclusive Deals</h2>
                <div className={styles.cardsContainer}>
                    <DealCard
                        image="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500"
                        title="Summer Getaway"
                        description="Get 20% off on all bookings made for the summer season."
                    />
                    <DealCard
                        image="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500"
                        title="Weekend Special"
                        description="Enjoy a complimentary breakfast on all weekend stays."
                    />
                    <DealCard
                        image="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=500"
                        title="Family Package"
                        description="Special discounts and activities for the whole family."
                    />
                </div>
            </section>

            <section className={styles.customerGallery}>
                <h2 className={styles.sectionTitle}>From Our Guests</h2>
                <Slider {...gallerySettings}>
                    {galleryImages.map((img, index) => (
                        <div key={index} className={styles.gallerySlide}>
                            <img src={img.src} alt={img.alt} />
                        </div>
                    ))}
                </Slider>
            </section>
        </div>
    );
}

export default Hotelbooking;