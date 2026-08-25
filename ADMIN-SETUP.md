# إعداد لوحة الإدارة

1. افتح Firebase Console ثم **Authentication → Sign-in method** وفعّل **Email/Password**.
2. من **Authentication → Users** أنشئ حساب الإدارة وانسخ قيمة `UID` الخاصة به.
3. في Firestore أنشئ collection باسم `admins` ثم document يكون اسمه هو الـ `UID` نفسه، وأضف:
   - `isActive` من نوع Boolean وقيمته `true`
   - `email` من نوع String (للتعريف فقط)
4. افتح **Firestore Database → Rules**، والصق محتوى `firestore.rules` ثم اضغط **Publish**.
5. افتح `admin.html` وسجّل الدخول بحساب الإدارة.


لا تضع كلمة مرور الإدارة أو ملف Service Account داخل GitHub. إعدادات Firebase الموجودة في `firebase-config.js` هي إعدادات الويب العامة وليست كلمة مرور.
