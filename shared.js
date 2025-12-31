// shared-data.js - This will be used by both index.html and admin.html

// Gallery Data Management
function getGalleryItems() {
    return JSON.parse(localStorage.getItem('bigHeartGallery')) || [];
}

function saveGalleryItem(item) {
    const gallery = getGalleryItems();
    const newId = gallery.length > 0 ? Math.max(...gallery.map(item => item.id)) + 1 : 1;
    item.id = newId;
    gallery.push(item);
    localStorage.setItem('bigHeartGallery', JSON.stringify(gallery));
    return item;
}

function deleteGalleryItem(id) {
    let gallery = getGalleryItems();
    gallery = gallery.filter(item => item.id !== id);
    localStorage.setItem('bigHeartGallery', JSON.stringify(gallery));
    return gallery;
}

function updateGalleryItem(id, updates) {
    let gallery = getGalleryItems();
    gallery = gallery.map(item => {
        if (item.id === id) {
            return { ...item, ...updates };
        }
        return item;
    });
    localStorage.setItem('bigHeartGallery', JSON.stringify(gallery));
    return gallery;
}

// Booking Data Management
function getBookings() {
    return JSON.parse(localStorage.getItem('bigHeartBookings')) || [];
}

function saveBooking(booking) {
    const bookings = getBookings();
    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    booking.id = newId;
    booking.status = booking.status || 'pending';
    booking.createdAt = new Date().toISOString();
    bookings.push(booking);
    localStorage.setItem('bigHeartBookings', JSON.stringify(bookings));
    
    // Add notification
    addNotification('booking', 'New Booking', `${booking.name} booked a ${booking.serviceType || 'tattoo'} session`, false);
    
    return booking;
}

function updateBookingStatus(id, status) {
    let bookings = getBookings();
    bookings = bookings.map(booking => {
        if (booking.id === id) {
            return { ...booking, status, updatedAt: new Date().toISOString() };
        }
        return booking;
    });
    localStorage.setItem('bigHeartBookings', JSON.stringify(bookings));
    return bookings;
}

function deleteBooking(id) {
    let bookings = getBookings();
    bookings = bookings.filter(booking => booking.id !== id);
    localStorage.setItem('bigHeartBookings', JSON.stringify(bookings));
    return bookings;
}

// Notification Management
function getNotifications() {
    return JSON.parse(localStorage.getItem('bigHeartNotifications')) || [];
}

function addNotification(type, title, message, read = false) {
    const notifications = getNotifications();
    const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    
    const newNotification = {
        id: newId,
        type,
        title,
        message,
        time: "Just now",
        read,
        createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem('bigHeartNotifications', JSON.stringify(notifications));
    return newNotification;
}

function markNotificationAsRead(id) {
    let notifications = getNotifications();
    notifications = notifications.map(notification => {
        if (notification.id === id) {
            return { ...notification, read: true };
        }
        return notification;
    });
    localStorage.setItem('bigHeartNotifications', JSON.stringify(notifications));
    return notifications;
}

function markAllNotificationsAsRead() {
    let notifications = getNotifications();
    notifications = notifications.map(notification => ({
        ...notification,
        read: true
    }));
    localStorage.setItem('bigHeartNotifications', JSON.stringify(notifications));
    return notifications;
}

// Format time for display
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}