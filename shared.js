// shared.js - Updated for backend API
const API_BASE_URL = window.location.origin + '/api';

// Gallery Data Management
async function getGalleryItems(category = null) {
    try {
        const url = category ? `${API_BASE_URL}/gallery?category=${category}` : `${API_BASE_URL}/gallery`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return JSON.parse(localStorage.getItem('bigHeartGallery')) || [];
    }
}

async function saveGalleryItem(item) {
    try {
        const response = await fetch(`${API_BASE_URL}/gallery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving gallery item:', error);
        // Fallback to localStorage
        const gallery = JSON.parse(localStorage.getItem('bigHeartGallery')) || [];
        const newId = gallery.length > 0 ? Math.max(...gallery.map(item => item.id)) + 1 : 1;
        item.id = newId;
        gallery.push(item);
        localStorage.setItem('bigHeartGallery', JSON.stringify(gallery));
        return item;
    }
}

async function deleteGalleryItem(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        // Fallback to localStorage
        let gallery = JSON.parse(localStorage.getItem('bigHeartGallery')) || [];
        gallery = gallery.filter(item => item.id !== id);
        localStorage.setItem('bigHeartGallery', JSON.stringify(gallery));
        return gallery;
    }
}

// Booking Data Management
async function getBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return JSON.parse(localStorage.getItem('bigHeartBookings')) || [];
    }
}

async function saveBooking(booking) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(booking)
        });
        const result = await response.json();
        
        // Add notification
        addNotification('booking', 'New Booking', `${booking.name} booked a ${booking.serviceType || 'tattoo'} session`, false);
        
        return result;
    } catch (error) {
        console.error('Error saving booking:', error);
        // Fallback to localStorage
        const bookings = JSON.parse(localStorage.getItem('bigHeartBookings')) || [];
        const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
        booking.id = newId;
        booking.status = booking.status || 'pending';
        booking.createdAt = new Date().toISOString();
        bookings.push(booking);
        localStorage.setItem('bigHeartBookings', JSON.stringify(bookings));
        
        addNotification('booking', 'New Booking', `${booking.name} booked a ${booking.serviceType || 'tattoo'} session`, false);
        
        return booking;
    }
}

// Add the rest of your functions (updateBookingStatus, deleteBooking, etc.) with similar async/await patterns

// ... rest of your existing functions ...
