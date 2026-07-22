MY BLOOD IS YOURS - PROFESSIONAL RED UI VERSION

Updated:
- Consistent red visual identity across all pages
- Shared styles.css
- Back button added to every navigable page
- Responsive mobile-first layout
- Professional cards, buttons, spacing, shadows, typography
- Firebase donor results preserved
- Donor list shows name + Call Donor button
- Phone number remains hidden

Flow:
Choose your city.htm
-> albekaa.html
-> menu.htm
-> search.html
-> results.html


ADD YOUR BLOOD CATEGORY - IMPLEMENTED
- New page: add-yourself.html
- Automatically receives selected region and town from menu.htm
- Fields: FullName, PhoneNumber, BloodType, Location
- Saves directly to Firebase Realtime Database /Persons
- Uses the same field names as the Xamarin app:
  FullName
  PhoneNumber
  BloodType
  Location
- Validates name, phone number, and blood type
- Shows success/error messages
- Returns to the selected town menu after successful save
- Back button preserves selected town

IMPORTANT:
Firebase Realtime Database security rules must allow write access for this web page.


VERSION 1 COMPLETE
Pages included:
- Choose your city.htm
- albekaa.html
- menu.htm
- search.html
- results.html
- add-yourself.html
- about.html
- contact.html
- styles.css

Notes:
- About Us and Contact Us are now connected from menu.htm.
- Contact page contains placeholders for official email and phone/WhatsApp number.
- Replace those placeholders before publishing.


VERSION 1.1
- Contact email updated to eng.mohamad.mahmoud1986@gmail.com
- Contact phone updated to 0096170530939
- Email button opens the user's email app.
- Call button uses +96170530939 for direct dialing.


VERSION 1.2
- Contact Us page upgraded to a real request form.
- Fields:
  FullName
  PhoneNumber
  Email
  RequestType
  Message
  CreatedAt
- Requests are saved to Firebase Realtime Database:
  /ContactRequests
- Direct Email Us and Call Us buttons remain available.
- Firebase write permissions must allow writing to /ContactRequests.
