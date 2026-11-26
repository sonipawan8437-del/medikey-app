/**
 * MediKey | Centralized Internationalization & Translation System (i18n.js)
 * Clean, patient-friendly healthcare translations for English, Hindi, and Marathi.
 */

export const i18n = {
  en: {
    // Brand & Technical terms
    brandName: 'MediKey',
    brandTagline: 'Digital Healthcare Identification Platform',
    poweredBy: 'Powered by MediKey',
    emergencyDisclaimer: 'For urgent emergency dispatch dial 112 / 108 / 911',
    sos112: '🚨 SOS 112',
    secureCloud: '● Secure Cloud',
    activeSync: '● Active',
    offlineStatus: '● Status: Offline (No internet detected)',
    back: '← Back',

    // Auth - Login
    welcome: 'Welcome back',
    loginSubtitle: 'Sign in to access your personal medical ID and health records.',
    email: 'Email address *',
    emailPlaceholder: 'name@example.com',
    password: 'Password *',
    passwordPlaceholder: 'Your password',
    signIn: 'Sign In',
    forgotPassword: 'Forgot password?',
    newPatient: 'New patient? Register',
    demoBadge: '🧪 Verified Demo Patient',
    demoSubtitle: 'Instant access without waiting for email verification quotas:',
    fillDemoCreds: 'Fill Demo Credentials',

    // Auth - Register
    createAccount: 'Create your account',
    registerSubtitle: 'Register to generate your unique MediKey Digital Health ID.',
    fullName: 'Full name *',
    fullNamePlaceholder: 'e.g. Alex Morgan',
    createPassword: 'Create password *',
    passwordMin: 'At least 6 characters',
    confirmPassword: 'Confirm password *',
    confirmPasswordPlaceholder: 'Repeat your password',
    preferredLanguage: 'Preferred language / भाषा निवडा / भाषा चुनें',
    registerAccount: 'Register Account',
    alreadyRegistered: 'Already registered?',
    loginHere: 'Login here',

    // Auth - Reset Password
    resetPasswordTitle: 'Reset password',
    resetPasswordSubtitle: 'Enter your registered email address to receive a secure password recovery link.',
    registeredEmailLabel: 'Registered email address *',
    sendRecoveryEmail: 'Send Recovery Email',
    backToLogin: 'Back to login',

    // Auth - Update Password
    setNewPasswordTitle: 'Set new password',
    updatePasswordSubtitle: 'Enter and confirm your new secure password below to regain account access.',
    newPasswordLabel: 'New password * (At least 6 characters)',
    confirmNewPasswordLabel: 'Confirm new password *',
    updatePasswordBtn: 'Update Password',
    cancelAndReturn: 'Cancel & Return to Login',
    patientPrivacyNotice: '🔒 Patient Privacy: Encrypted in transit and protected by secure access controls.',

    // Top Header & Menu
    menuLabelLang: 'LANGUAGE / भाषा',
    menuProfile: '♙ View Profile Overview',
    menuEditProfile: '✎ Edit Full Profile',
    menuPersonal: '👤 Personal Identity & Photo',
    menuInstallApp: '📲 Install MediKey App',
    menuPrivacy: '🔒 Privacy & Architecture',
    menuLogout: '↪ Logout',

    // Navigation (Desktop & Bottom Mobile)
    navDashboard: 'Dashboard',
    navRecords: 'Medical Records',
    navScan: 'QR Scanner',
    navProfile: 'Profile & Settings',
    bottomHome: 'Home',
    bottomRecords: 'Records',
    bottomScan: 'Scan',
    bottomProfile: 'Profile',

    // Dashboard - Welcome
    helloPatient: 'Hello, Patient',
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    digitalPassVerified: 'Digital Healthcare Pass · Verified',

    // Dashboard - Digital Medical ID Card
    idCardBrand: '✚ MediKey Health ID',
    settingsBtn: '⚙ Settings',
    healthIdLabel: 'Health ID:',
    shareIdBtn: 'Share ID ↗',
    bloodBadge: '🩸 Blood:',
    allergyBadge: '⚠️ Allergy:',
    conditionBadge: '⚕️',
    notProvided: 'Not provided',
    notSpecified: 'Not specified',
    unknown: 'Unknown',

    // Dashboard - Emergency SOS Bar
    emergencySummaryTitle: '🛡️ Emergency Health Summary',
    detailsBtn: 'Details →',
    icePrefix: 'ICE:',
    allergiesPrefix: 'Allergies:',
    callEmergencyContact: '☎ Call Emergency Contact',
    addEditContact: 'Add / Edit Contact',
    noEmergencyContactSaved: 'No emergency contact saved.',
    loadingEmergencyDetails: 'Loading emergency details...',

    // Dashboard - Clinical Priority Cards
    upcomingAppointments: '📅 Upcoming Appointments',
    addAppointment: '＋ Add Appointment',
    noAppointments: 'No scheduled doctor visits yet.',
    activePrescriptions: '💊 Active Prescriptions',
    addMedicine: '＋ Add Medicine',
    noPrescriptions: 'No active prescriptions entered yet.',
    recentDocuments: '📄 Recent Documents',
    uploadDocument: '＋ Upload Document',
    noDocuments: 'No medical documents uploaded to vault yet.',

    // Dashboard - Quick Actions
    quickActionsTitle: '⚡ Quick Actions',
    healthcareBadge: 'Healthcare',
    qaRecords: 'Records',
    qaRecordsDesc: 'Vault docs',
    qaMedicines: 'Medicines',
    qaMedicinesDesc: 'Active RX',
    qaVisits: 'Visits',
    qaVisitsDesc: 'Doctor appts',
    qaMedicalKit: 'Medical Kit',
    qaMedicalKitDesc: 'First aid supplies',
    qaShareId: 'Share ID',
    qaShareIdDesc: 'Consented QR',
    qaHealthLog: 'Health Log',
    qaHealthLogDesc: 'Daily vitals',
    qaScanPass: 'Scan Pass',
    qaScanPassDesc: 'Verify MediKey',
    qaIceCard: 'ICE Card',
    qaIceCardDesc: 'First-responder',

    // Dashboard - ICE Card
    iceCardTitle: '🚑 In Case of Emergency (ICE)',
    iceCardDesc: 'First responders can immediately dial your emergency guardian contact during critical trauma situations.',
    manageContactsBtn: 'Manage Contacts →',

    // Dashboard - Nearby Hospitals
    nearbyHospitalsTitle: '🏥 Nearby Emergency Hospitals',
    nearbyHospitalsDesc: 'Locate trauma centers near your GPS coordinates.',
    findHospitalsBtn: 'Find Nearby Hospitals',
    openGoogleMapsBtn: 'Open in Google Maps',
    hospitalStatusMuted: 'Tap above to locate emergency facilities.',

    // Dashboard - Privacy Guarantee
    privacyGuaranteeTitle: '🔒 Patient Privacy Guarantee',
    privacyBadge: 'Secure & Private',
    privacyGuaranteeDesc: 'Your health data is encrypted in transit and securely stored in private cloud databases. First responders access only the specific emergency fields you have authorized.',
    viewArchitectureBtn: 'View Architecture & Security →',

    // View 2: Medical Records
    searchRecordsPlaceholder: 'Search records, medications, clinics...',
    catAll: 'All Records',
    catHospital: 'Hospital Records',
    catPrescriptions: 'Prescriptions',
    catLabs: 'Lab Reports',
    catCertificates: 'Certificates',
    catHistory: 'Medical History',
    catNotes: 'Health Notes',
    catKit: 'Medical Kit',
    noRecordsFound: 'No records found in this category.',
    recordDate: 'Date',
    recordDoctor: 'Doctor',
    recordFacility: 'Facility',
    recordNotes: 'Notes',
    viewAttachment: 'View Attachment',
    deleteBtn: 'Delete',
    editBtn: 'Edit',

    // View 3: QR Scanner
    scannerTitle: 'Scan MediKey Emergency Pass',
    scannerTips: "Point camera at another patient's MediKey QR pass to verify emergency health details.",
    scanFromPhoto: '📷 Scan from Photo',
    restartCamera: 'Restart Camera',
    scannerPrivacyNotice: '🔒 Privacy First: Scans locally in your browser. Encrypted emergency tokens are verified via restricted cryptographic verification.',

    // View 4: Profile View
    profileOverviewTitle: 'Patient Profile Overview',
    profileIdentityGroup: 'Health Identity & Medical Info',
    itemProfileOverview: 'View Full Profile Overview',
    itemPersonal: 'Personal Identity & Photo',
    itemContact: 'Contact & Phone Details',
    itemMedical: 'Critical Medical Parameters (Blood, Allergies)',
    itemHistory: 'Medical & Surgical History',
    itemICE: 'In Case of Emergency (ICE) Contacts',
    profileSecurityGroup: 'Security, Privacy & Preferences',
    itemQRPass: 'Manage Emergency QR Pass & Consent',
    itemChangePassword: 'Change Password & Account Security',
    itemAppPreferences: 'Language & App Preferences',
    itemPrivacyOverview: 'Security & Architecture Overview',
    itemSignOut: 'Sign Out of MediKey',

    // Modals - Profile Fields
    regEmailAccountId: 'REGISTERED EMAIL (ACCOUNT ID)',
    bloodGroupLabel: 'BLOOD GROUP',
    ageLabel: 'AGE',
    yearsOld: 'years',
    phoneNumberLabel: 'PHONE NUMBER',
    knownAllergiesLabel: 'KNOWN ALLERGIES',
    chronicConditionsLabel: 'CHRONIC CONDITIONS',
    activeMedicationsLabel: 'ACTIVE MEDICATIONS',
    closeBtn: 'Close',
    saveBtn: 'Save',
    saveChangesBtn: 'Save Changes',
    cancelBtn: 'Cancel',
    updateBtn: 'Update',
    proceedToEdit: '✎ Edit Profile',
    editPatientProfile: 'Edit Patient Profile',
    tabPersonal: '👤 Personal',
    tabContact: '📞 Contact',
    tabMedical: '🩺 Medical',
    profileAvatarLabel: 'Profile Avatar (Tap to select picture)',
    ageFieldLabel: 'Age',
    accountEmailReadonly: 'Account Email (Read-only)',
    accountEmailNote: 'Account email is verified with secure authentication and cannot be changed here.',
    mobileNumberLabel: 'Mobile Number',
    residentialAddressLabel: 'Residential Address',
    primaryEmergencyContact: 'Primary Emergency Contact (Guardian)',
    guardianNameLabel: 'Guardian / Contact Name',
    guardianPhoneLabel: 'Emergency Phone Number',
    guardianRelationshipLabel: 'Relationship',
    saveProfileBtn: 'Save Profile Changes',

    // Modals - Medical Info
    criticalMedicalParams: 'Critical Medical Parameters',
    bloodGroupSelectLabel: 'Blood Group',
    knownAllergiesField: 'Known Drug & Food Allergies',
    chronicConditionsField: 'Chronic Medical Conditions',
    currentMedicationsField: 'Current Routine Medications',

    // Modals - Medical History & Kit
    medicalHistoryTitle: 'Medical & Surgical History',
    pastSurgeriesField: 'Past Surgeries & Procedures',
    familyHistoryField: 'Family Health History',
    immunizationField: 'Immunization & Vaccinations',
    medicalKitTitle: 'Medical Kit & First Aid Supplies',
    medicalKitDesc: 'Track first aid medicines and emergency medical supplies in your home kit.',
    itemNameLabel: 'Item / Medication Name *',
    itemQuantityLabel: 'Quantity / Status',
    itemExpiryLabel: 'Expiry Date / Notes',
    addItemBtn: '＋ Add Kit Item',

    // Modals - Add Appointment
    addAppointmentTitle: 'Add Scheduled Appointment',
    doctorSpecialistLabel: 'Doctor / Specialist Name *',
    clinicHospitalLabel: 'Clinic / Hospital Name *',
    appointmentDateTimeLabel: 'Date & Time *',
    appointmentPurposeLabel: 'Purpose / Notes',

    // Modals - Add Prescription
    addPrescriptionTitle: 'Add Active Prescription',
    medicineNameLabel: 'Medication Name *',
    dosageStrengthLabel: 'Dosage & Strength (e.g. 500mg) *',
    frequencyLabel: 'Frequency & Timing (e.g. 1-0-1 after food) *',
    prescribingDoctorLabel: 'Prescribing Doctor',
    durationInstructionsLabel: 'Duration & Special Instructions',

    // Modals - Add Record
    addRecordTitle: 'Add Health Record',
    recordTitleLabel: 'Record Title *',
    recordCategoryLabel: 'Category *',
    facilityDoctorLabel: 'Doctor / Clinic / Lab',
    recordDateLabel: 'Date of Record *',
    recordNotesLabel: 'Notes / Summary',
    attachDocumentLabel: 'Attach Document (PDF or Image)',

    // Modals - Change Password
    changePasswordTitle: 'Change Password & Security',
    currentPasswordLabel: 'Current Password *',
    newPasswordChangeLabel: 'New Password * (Min 6 characters)',
    confirmNewPasswordChangeLabel: 'Confirm New Password *',

    // Modals - App Preferences
    appPreferencesTitle: 'Language & App Preferences',
    preferredLanguageSetting: 'Preferred Language / भाषा निवडा / भाषा चुनें',

    // Modals - Privacy & Architecture
    privacyModalTitle: 'Patient Privacy & System Architecture',
    privacySection1Title: '🔒 1. Cryptographic Zero-PII Emergency Passes',
    privacySection1Desc: 'Emergency passes use randomly generated single-use tokens. Printed cards contain zero patient names, blood groups, or medical notes directly on the card surface.',
    privacySection2Title: '🛡️ 2. Selective Patient Consent',
    privacySection2Desc: 'You control exactly which medical parameters are shared during emergencies (blood group, allergies, conditions, or medications). Consent can be modified or revoked at any time.',
    privacySection3Title: '☁️ 3. Private Cloud Infrastructure',
    privacySection3Desc: 'All patient documents and profiles are stored in private cloud databases protected by Row Level Security (RLS) policies.',

    // Modals - Emergency Pass & QR Share
    emergencyShareTitle: 'Emergency Pass & Consent Settings',
    emergencyPassExplanation: 'Generate an emergency QR pass that first responders can scan to view critical health details without logging in.',
    consentAllergies: 'Share Known Allergies',
    consentConditions: 'Share Chronic Conditions',
    consentMedications: 'Share Active Medications',
    passValidityLabel: 'Pass Validity Duration',
    duration1Day: '24 Hours (Temporary Pass)',
    duration7Days: '7 Days (Travel Pass)',
    duration30Days: '30 Days (Standard Pass)',
    duration1Year: '1 Year (Long-term Medical Pass)',
    generatePassBtn: 'Generate Emergency Pass',
    revokePassBtn: 'Revoke Active Pass',
    activePassNotice: 'Active emergency pass token is currently valid.',
    noActivePass: 'No active emergency pass. Tap below to generate one.',

    // Modals - PVC Card Export
    pvcCardTitle: 'Download Branded Emergency QR Card',
    pvcCardSubtitle: 'CR80 standard physical card format (53.98 × 85.60 mm) for wallet or lanyard.',
    downloadPngBtn: 'Download High-Res PNG (600 DPI)',
    downloadPdfBtn: 'Download Print-Ready PDF',
    pvcInstructions: 'Instructions: Print on plastic PVC ID card at 100% scale. First responders scan the QR code to access your consented emergency health pass.',
    copyPassLinkBtn: 'Copy Pass Link',

    // Offline Overlay
    offlineTitle: "You're offline",
    offlineSubtitle: 'Connect to the internet to access your medical information.',
    retryConnectionBtn: '🔄 Retry Connection',
    callEmergencyOfflineBtn: '🚨 Call Emergency 112',

    // PWA Smart Update Banner
    newVersionAvailable: 'New version available',
    updateToGetLatest: 'Update to get the latest features.',
    updateNowBtn: 'Update Now',
    laterBtn: 'Later',

    // iOS Safari Install Modal
    iosInstallTitle: 'Install MediKey on iPhone / iPad',
    iosInstallStep1: '1. Tap the Share button in Safari (at the bottom of the screen).',
    iosInstallStep2: '2. Scroll down and tap "Add to Home Screen".',
    gotItBtn: 'Got it',

    // Profile Completion Banner
    profileSetupTitle: 'Profile Setup',
    completedText: 'completed',
    profileSetupDesc: 'Add your blood group and emergency contact so first responders can assist you in an emergency.',
    completeProfileBtn: 'Complete Profile →',
    maybeLaterBtn: 'Maybe Later',

    // Toasts & Alerts
    prefSavedToast: 'Language preference saved.',
    profileSavedToast: 'Profile updated successfully.',
    recordSavedToast: 'Health record saved successfully.',
    appointmentSavedToast: 'Appointment saved.',
    prescriptionSavedToast: 'Prescription saved.',
    contactSavedToast: 'Emergency contact saved.',
    cardCopiedToast: 'Pass URL copied to clipboard.',
    pleaseSignInToast: 'Please sign in to continue.',
    passwordUpdatedToast: 'Password updated successfully.',
    resetEmailSentToast: 'Password recovery email sent. Please check your inbox.',
    invalidCredsError: 'Incorrect email address or password. Please verify your details.',
    networkErrorMsg: 'Unable to connect to the healthcare service. Please check your network connection.',
    rateLimitErrorMsg: 'Too many attempts. Please wait a few moments before trying again.',

    // Common Dropdown Values
    relSpouse: 'Spouse',
    relParent: 'Parent',
    relChild: 'Child',
    relSibling: 'Sibling',
    relRelative: 'Relative',
    relFriend: 'Friend',
    relDoctor: 'Doctor',
    relOther: 'Other'
  },

  hi: {
    // Brand & Technical terms
    brandName: 'MediKey',
    brandTagline: 'डिजिटल हेल्थकेयर पहचान प्लेटफॉर्म',
    poweredBy: 'Powered by MediKey',
    emergencyDisclaimer: 'तत्काल आपातकालीन सहायता के लिए डायल करें 112 / 108 / 911',
    sos112: '🚨 SOS 112',
    secureCloud: '● सुरक्षित क्लाउड',
    activeSync: '● सक्रिय',
    offlineStatus: '● स्थिति: ऑफलाइन (इंटरनेट नहीं मिला)',
    back: '← वापस',

    // Auth - Login
    welcome: 'वापस स्वागत है',
    loginSubtitle: 'अपने मेडिकल आईडी और स्वास्थ्य रिकॉर्ड देखने के लिए लॉगिन करें।',
    email: 'ईमेल पता *',
    emailPlaceholder: 'name@example.com',
    password: 'पासवर्ड *',
    passwordPlaceholder: 'आपका पासवर्ड',
    signIn: 'साइन इन करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    newPatient: 'नए मरीज? पंजीकरण करें',
    demoBadge: '🧪 सत्यापित डेमो मरीज',
    demoSubtitle: 'ईमेल सत्यापन की प्रतीक्षा किए बिना तुरंत लॉगिन करें:',
    fillDemoCreds: 'डेमो लॉगिन भरें',

    // Auth - Register
    createAccount: 'अपना खाता बनाएँ',
    registerSubtitle: 'अपनी विशिष्ट MediKey डिजिटल हेल्थ आईडी बनाने के लिए पंजीकरण करें।',
    fullName: 'पूरा नाम *',
    fullNamePlaceholder: 'उदा. राजेश कुमार',
    createPassword: 'पासवर्ड बनाएँ *',
    passwordMin: 'कम से कम 6 अक्षर',
    confirmPassword: 'पासवर्ड की पुष्टि करें *',
    confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
    preferredLanguage: 'पसंदीदा भाषा / भाषा निवडा / भाषा चुनें',
    registerAccount: 'खाता पंजीकृत करें',
    alreadyRegistered: 'पहले से पंजीकृत हैं?',
    loginHere: 'यहाँ लॉगिन करें',

    // Auth - Reset Password
    resetPasswordTitle: 'पासवर्ड रीसेट करें',
    resetPasswordSubtitle: 'पासवर्ड रिकवरी लिंक प्राप्त करने के लिए अपना पंजीकृत ईमेल पता दर्ज करें।',
    registeredEmailLabel: 'पंजीकृत ईमेल पता *',
    sendRecoveryEmail: 'रिकवरी ईमेल भेजें',
    backToLogin: 'लॉगिन पर वापस जाएँ',

    // Auth - Update Password
    setNewPasswordTitle: 'नया पासवर्ड सेट करें',
    updatePasswordSubtitle: 'खाते तक पहुँच प्राप्त करने के लिए नीचे नया पासवर्ड दर्ज करें।',
    newPasswordLabel: 'नया पासवर्ड * (कम से कम 6 अक्षर)',
    confirmNewPasswordLabel: 'नए पासवर्ड की पुष्टि करें *',
    updatePasswordBtn: 'पासवर्ड अपडेट करें',
    cancelAndReturn: 'रद्द करें और लॉगिन पर लौटें',
    patientPrivacyNotice: '🔒 मरीज गोपनीयता: डेटा एन्क्रिप्टेड है और सुरक्षित एक्सेस नियंत्रण द्वारा सुरक्षित है।',

    // Top Header & Menu
    menuLabelLang: 'LANGUAGE / भाषा',
    menuProfile: '♙ प्रोफाइल अवलोकन देखें',
    menuEditProfile: '✎ पूरी प्रोफाइल बदलें',
    menuPersonal: '👤 व्यक्तिगत पहचान और फोटो',
    menuInstallApp: '📲 MediKey ऐप इंस्टॉल करें',
    menuPrivacy: '🔒 गोपनीयता और वास्तुकला',
    menuLogout: '↪ लॉगआउट',

    // Navigation (Desktop & Bottom Mobile)
    navDashboard: 'डैशबोर्ड',
    navRecords: 'मेडिकल रिकॉर्ड',
    navScan: 'QR स्कैनर',
    navProfile: 'प्रोफाइल और सेटिंग्स',
    bottomHome: 'होम',
    bottomRecords: 'रिकॉर्ड',
    bottomScan: 'स्कैन',
    bottomProfile: 'प्रोफाइल',

    // Dashboard - Welcome
    helloPatient: 'नमस्ते, मरीज',
    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    digitalPassVerified: 'डिजिटल हेल्थकेयर पास · सत्यापित',

    // Dashboard - Digital Medical ID Card
    idCardBrand: '✚ MediKey हेल्थ ID',
    settingsBtn: '⚙ सेटिंग्स',
    healthIdLabel: 'हेल्थ ID:',
    shareIdBtn: 'आईडी साझा करें ↗',
    bloodBadge: '🩸 रक्त समूह:',
    allergyBadge: '⚠️ एलर्जी:',
    conditionBadge: '⚕️',
    notProvided: 'उपलब्ध नहीं',
    notSpecified: 'निर्दिष्ट नहीं',
    unknown: 'अज्ञात',

    // Dashboard - Emergency SOS Bar
    emergencySummaryTitle: '🛡️ आपातकालीन स्वास्थ्य सारांश',
    detailsBtn: 'विवरण देखें →',
    icePrefix: 'इमरजेंसी संपर्क:',
    allergiesPrefix: 'एलर्जी:',
    callEmergencyContact: '☎ इमरजेंसी संपर्क को कॉल करें',
    addEditContact: 'संपर्क जोड़ें / बदलें',
    noEmergencyContactSaved: 'कोई इमरजेंसी संपर्क सुरक्षित नहीं है।',
    loadingEmergencyDetails: 'आपातकालीन विवरण लोड हो रहा है...',

    // Dashboard - Clinical Priority Cards
    upcomingAppointments: '📅 आगामी अपॉइंटमेंट्स',
    addAppointment: '＋ अपॉइंटमेंट जोड़ें',
    noAppointments: 'अभी कोई डॉक्टर अपॉइंटमेंट नहीं है।',
    activePrescriptions: '💊 वर्तमान दवाइयाँ',
    addMedicine: '＋ दवाई जोड़ें',
    noPrescriptions: 'अभी कोई चालू दवाई दर्ज नहीं है।',
    recentDocuments: '📄 हालिया दस्तावेज़',
    uploadDocument: '＋ दस्तावेज़ अपलोड करें',
    noDocuments: 'वॉल्ट में अभी कोई मेडिकल दस्तावेज़ अपलोड नहीं है।',

    // Dashboard - Quick Actions
    quickActionsTitle: '⚡ त्वरित विकल्प',
    healthcareBadge: 'हेल्थकेयर',
    qaRecords: 'रिकॉर्ड',
    qaRecordsDesc: 'वॉल्ट दस्तावेज़',
    qaMedicines: 'दवाइयाँ',
    qaMedicinesDesc: 'सक्रिय दवाइयाँ',
    qaVisits: 'अपॉइंटमेंट',
    qaVisitsDesc: 'डॉक्टर विज़िट',
    qaMedicalKit: 'मेडिकल किट',
    qaMedicalKitDesc: 'प्राथमिक उपचार',
    qaShareId: 'आईडी साझा करें',
    qaShareIdDesc: 'सहमति QR पास',
    qaHealthLog: 'स्वास्थ्य लॉग',
    qaHealthLogDesc: 'दैनिक स्वास्थ्य',
    qaScanPass: 'पास स्कैन करें',
    qaScanPassDesc: 'MediKey सत्यापित करें',
    qaIceCard: 'ICE कार्ड',
    qaIceCardDesc: 'रेस्क्यू पास',

    // Dashboard - ICE Card
    iceCardTitle: '🚑 आपातकालीन संपर्क (ICE)',
    iceCardDesc: 'आपातकालीन स्थिति में प्राथमिक उपचारकर्ता तुरंत आपके अभिभावक को कॉल कर सकते हैं।',
    manageContactsBtn: 'संपर्क प्रबंधित करें →',

    // Dashboard - Nearby Hospitals
    nearbyHospitalsTitle: '🏥 नजदीकी आपातकालीन अस्पताल',
    nearbyHospitalsDesc: 'अपने जीपीएस स्थान के निकटतम अस्पताल खोजें।',
    findHospitalsBtn: 'नजदीकी अस्पताल खोजें',
    openGoogleMapsBtn: 'गूगल मैप्स में खोलें',
    hospitalStatusMuted: 'निकटतम स्वास्थ्य केंद्र खोजने के लिए ऊपर टैप करें।',

    // Dashboard - Privacy Guarantee
    privacyGuaranteeTitle: '🔒 मरीज डेटा गोपनीयता सुरक्षा',
    privacyBadge: 'सुरक्षित और निजी',
    privacyGuaranteeDesc: 'आपका स्वास्थ्य डेटा एन्क्रिप्टेड है और सुरक्षित क्लाउड डेटाबेस में संग्रहीत है। आपातकालीन कर्मचारी केवल आपके द्वारा अधिकृत जानकारी ही देख सकते हैं।',
    viewArchitectureBtn: 'सुरक्षा और वास्तुकला देखें →',

    // View 2: Medical Records
    searchRecordsPlaceholder: 'रिकॉर्ड, दवाइयाँ, क्लिनिक खोजें...',
    catAll: 'सभी रिकॉर्ड',
    catHospital: 'अस्पताल रिकॉर्ड',
    catPrescriptions: 'प्रिस्क्रिप्शन',
    catLabs: 'लैब रिपोर्ट',
    catCertificates: 'प्रमाणपत्र',
    catHistory: 'चिकित्सा इतिहास',
    catNotes: 'स्वास्थ्य नोट्स',
    catKit: 'मेडिकल किट',
    noRecordsFound: 'इस श्रेणी में कोई रिकॉर्ड नहीं मिला।',
    recordDate: 'तारीख',
    recordDoctor: 'डॉक्टर',
    recordFacility: 'अस्पताल / क्लिनिक',
    recordNotes: 'नोट्स',
    viewAttachment: 'दस्तावेज़ देखें',
    deleteBtn: 'हटाएँ',
    editBtn: 'बदलें',

    // View 3: QR Scanner
    scannerTitle: 'MediKey इमरजेंसी पास स्कैन करें',
    scannerTips: 'मरीज के MediKey QR पास पर कैमरा रखें ताकि आपातकालीन जानकारी देखी जा सके।',
    scanFromPhoto: '📷 फोटो से स्कैन करें',
    restartCamera: 'कैमरा रीस्टार्ट करें',
    scannerPrivacyNotice: '🔒 पूर्ण गोपनीयता: स्कैनिंग आपके ब्राउज़र में सुरक्षित रूप से होती है। आपातकालीन टोकन सुरक्षित रूप से सत्यापित किए जाते हैं।',

    // View 4: Profile View
    profileOverviewTitle: 'मरीज प्रोफाइल अवलोकन',
    profileIdentityGroup: 'स्वास्थ्य पहचान और मेडिकल जानकारी',
    itemProfileOverview: 'पूरी प्रोफाइल का अवलोकन देखें',
    itemPersonal: 'व्यक्तिगत पहचान और फोटो',
    itemContact: 'संपर्क और फोन विवरण',
    itemMedical: 'महत्वपूर्ण मेडिकल पैरामीटर (रक्त समूह, एलर्जी)',
    itemHistory: 'चिकित्सा और सर्जिकल इतिहास',
    itemICE: 'आपातकालीन (ICE) संपर्क',
    profileSecurityGroup: 'सुरक्षा, गोपनीयता और प्राथमिकताएँ',
    itemQRPass: 'इमरजेंसी QR पास और सहमति प्रबंधित करें',
    itemChangePassword: 'पासवर्ड बदलें और खाता सुरक्षा',
    itemAppPreferences: 'भाषा और ऐप प्राथमिकताएँ',
    itemPrivacyOverview: 'सुरक्षा और वास्तुकला अवलोकन',
    itemSignOut: 'MediKey से साइन आउट करें',

    // Modals - Profile Fields
    regEmailAccountId: 'पंजीकृत ईमेल (खाता आईडी)',
    bloodGroupLabel: 'रक्त समूह',
    ageLabel: 'उम्र',
    yearsOld: 'वर्ष',
    phoneNumberLabel: 'फोन नंबर',
    knownAllergiesLabel: 'ज्ञात एलर्जी',
    chronicConditionsLabel: 'पुरानी बीमारियाँ',
    activeMedicationsLabel: 'वर्तमान दवाइयाँ',
    closeBtn: 'बंद करें',
    saveBtn: 'सेव करें',
    saveChangesBtn: 'बदलाव सेव करें',
    cancelBtn: 'रद्द करें',
    updateBtn: 'अपडेट करें',
    proceedToEdit: '✎ प्रोफाइल बदलें',
    editPatientProfile: 'मरीज प्रोफाइल बदलें',
    tabPersonal: '👤 व्यक्तिगत',
    tabContact: '📞 संपर्क',
    tabMedical: '🩺 मेडिकल',
    profileAvatarLabel: 'प्रोफाइल फोटो (फोटो चुनने के लिए टैप करें)',
    ageFieldLabel: 'उम्र',
    accountEmailReadonly: 'खाता ईमेल (केवल पढ़ने के लिए)',
    accountEmailNote: 'खाता ईमेल सुरक्षित प्रमाणीकरण से सत्यापित है और यहाँ नहीं बदला जा सकता।',
    mobileNumberLabel: 'मोबाइल नंबर',
    residentialAddressLabel: 'निवास का पता',
    primaryEmergencyContact: 'प्राथमिक इमरजेंसी संपर्क (अभिभावक)',
    guardianNameLabel: 'अभिभावक / संपर्क का नाम',
    guardianPhoneLabel: 'इमरजेंसी फोन नंबर',
    guardianRelationshipLabel: 'संबंध',
    saveProfileBtn: 'प्रोफाइल बदलाव सेव करें',

    // Modals - Medical Info
    criticalMedicalParams: 'महत्वपूर्ण मेडिकल पैरामीटर',
    bloodGroupSelectLabel: 'रक्त समूह',
    knownAllergiesField: 'दवा और भोजन की एलर्जी',
    chronicConditionsField: 'पुरानी बीमारियाँ / स्थितियाँ',
    currentMedicationsField: 'वर्तमान दैनिक दवाइयाँ',

    // Modals - Medical History & Kit
    medicalHistoryTitle: 'चिकित्सा और सर्जिकल इतिहास',
    pastSurgeriesField: 'पिछली सर्जरी और प्रक्रियाएँ',
    familyHistoryField: 'पारिवारिक स्वास्थ्य इतिहास',
    immunizationField: 'टीकाकरण और वैक्सीन',
    medicalKitTitle: 'मेडिकल किट और प्राथमिक उपचार',
    medicalKitDesc: 'अपने घरेलू किट में प्राथमिक उपचार की दवाइयों और आपातकालीन सामग्री की जानकारी रखें।',
    itemNameLabel: 'दवाई या सामग्री का नाम *',
    itemQuantityLabel: 'मात्रा / स्थिति',
    itemExpiryLabel: 'समाप्ति तारीख / नोट्स',
    addItemBtn: '＋ सामग्री जोड़ें',

    // Modals - Add Appointment
    addAppointmentTitle: 'डॉक्टर अपॉइंटमेंट जोड़ें',
    doctorSpecialistLabel: 'डॉक्टर / विशेषज्ञ का नाम *',
    clinicHospitalLabel: 'क्लिनिक / अस्पताल का नाम *',
    appointmentDateTimeLabel: 'तारीख और समय *',
    appointmentPurposeLabel: 'कारण / उद्देश्य',

    // Modals - Add Prescription
    addPrescriptionTitle: 'सक्रिय प्रिस्क्रिप्शन जोड़ें',
    medicineNameLabel: 'दवाई का नाम *',
    dosageStrengthLabel: 'खुराक और मात्रा (उदा. 500mg) *',
    frequencyLabel: 'लेने का समय (उदा. भोजन के बाद 1-0-1) *',
    prescribingDoctorLabel: 'डॉक्टर का नाम',
    durationInstructionsLabel: 'अवधि और विशेष निर्देश',

    // Modals - Add Record
    addRecordTitle: 'स्वास्थ्य रिकॉर्ड जोड़ें',
    recordTitleLabel: 'रिकॉर्ड का शीर्षक *',
    recordCategoryLabel: 'श्रेणी *',
    facilityDoctorLabel: 'डॉक्टर / क्लिनिक / लैब',
    recordDateLabel: 'रिकॉर्ड की तारीख *',
    recordNotesLabel: 'विवरण / नोट्स',
    attachDocumentLabel: 'दस्तावेज़ जोड़ें (PDF या फोटो)',

    // Modals - Change Password
    changePasswordTitle: 'पासवर्ड और सुरक्षा बदलें',
    currentPasswordLabel: 'वर्तमान पासवर्ड *',
    newPasswordChangeLabel: 'नया पासवर्ड * (कम से कम 6 अक्षर)',
    confirmNewPasswordChangeLabel: 'नए पासवर्ड की पुष्टि करें *',

    // Modals - App Preferences
    appPreferencesTitle: 'भाषा और ऐप प्राथमिकताएँ',
    preferredLanguageSetting: 'पसंदीदा भाषा / भाषा निवडा / भाषा चुनें',

    // Modals - Privacy & Architecture
    privacyModalTitle: 'मरीज डेटा गोपनीयता और वास्तुकला',
    privacySection1Title: '🔒 1. शून्य-व्यक्तिगत डेटा वाले आपातकालीन पास',
    privacySection1Desc: 'इमरजेंसी पास सुरक्षित टोकन का उपयोग करते हैं। कार्ड की बाहरी सतह पर मरीज का नाम या रक्त समूह सीधे नहीं छपा होता।',
    privacySection2Title: '🛡️ 2. मरीज की चयनित सहमति',
    privacySection2Desc: 'आप तय करते हैं कि आपातकालीन स्थिति में कौन सी स्वास्थ्य जानकारी साझा करनी है। सहमति कभी भी बदली या रद्द की जा सकती है।',
    privacySection3Title: '☁️ 3. निजी क्लाउड अवसंरचना',
    privacySection3Desc: 'सभी मेडिकल रिकॉर्ड सुरक्षित क्लाउड डेटाबेस में संग्रहीत हैं जो रो-लेवल सुरक्षा नीतियों द्वारा संरक्षित हैं।',

    // Modals - Emergency Pass & QR Share
    emergencyShareTitle: 'इमरजेंसी पास और सहमति सेटिंग्स',
    emergencyPassExplanation: 'एक आपातकालीन QR पास बनाएँ जिसे स्कैन करके प्राथमिक उपचारकर्ता बिना लॉगिन किए आपकी आवश्यक स्वास्थ्य जानकारी देख सकें।',
    consentAllergies: 'ज्ञात एलर्जी साझा करें',
    consentConditions: 'पुरानी बीमारियाँ साझा करें',
    consentMedications: 'वर्तमान दवाइयाँ साझा करें',
    passValidityLabel: 'पास की वैधता अवधि',
    duration1Day: '24 घंटे (अस्थायी पास)',
    duration7Days: '7 दिन (यात्रा पास)',
    duration30Days: '30 दिन (मानक पास)',
    duration1Year: '1 वर्ष (दीर्घकालिक मेडिकल पास)',
    generatePassBtn: 'इमरजेंसी पास बनाएँ',
    revokePassBtn: 'सक्रिय पास रद्द करें',
    activePassNotice: 'सक्रिय आपातकालीन पास टोकन वर्तमान में मान्य है।',
    noActivePass: 'कोई सक्रिय पास नहीं है। पास बनाने के लिए नीचे टैप करें।',

    // Modals - PVC Card Export
    pvcCardTitle: 'ब्रांडेड इमरजेंसी QR कार्ड डाउनलोड करें',
    pvcCardSubtitle: 'वॉलेट या डोरी के लिए मानक CR80 भौतिक कार्ड प्रारूप (53.98 × 85.60 mm)।',
    downloadPngBtn: 'हाई-रिज़ॉल्यूशन PNG डाउनलोड करें (600 DPI)',
    downloadPdfBtn: 'प्रिंट-रेडी PDF डाउनलोड करें',
    pvcInstructions: 'निर्देश: 100% स्केल पर पीवीसी प्लास्टिक आईडी कार्ड पर प्रिंट करें। प्रथम प्रतिक्रियाकर्ता आपकी सहमति प्राप्त आपातकालीन स्वास्थ्य जानकारी देखने के लिए QR कोड स्कैन करते हैं।',
    copyPassLinkBtn: 'पास लिंक कॉपी करें',

    // Offline Overlay
    offlineTitle: 'आप ऑफलाइन हैं',
    offlineSubtitle: 'अपनी स्वास्थ्य जानकारी देखने के लिए कृपया इंटरनेट से कनेक्ट करें।',
    retryConnectionBtn: '🔄 पुनः प्रयास करें',
    callEmergencyOfflineBtn: '🚨 इमरजेंसी 112 पर कॉल करें',

    // PWA Smart Update Banner
    newVersionAvailable: 'नया संस्करण उपलब्ध है',
    updateToGetLatest: 'नवीनतम सुविधाओं के लिए अपडेट करें।',
    updateNowBtn: 'अभी अपडेट करें',
    laterBtn: 'बाद में',

    // iOS Safari Install Modal
    iosInstallTitle: 'iPhone / iPad पर MediKey इंस्टॉल करें',
    iosInstallStep1: '1. सफारी में नीचे दिए गए शेयर बटन पर टैप करें।',
    iosInstallStep2: '2. नीचे स्क्रॉल करके "होम स्क्रीन में जोड़ें" (Add to Home Screen) चुनें।',
    gotItBtn: 'समझ गया',

    // Profile Completion Banner
    profileSetupTitle: 'प्रोफाइल सेटअप',
    completedText: 'पूर्ण',
    profileSetupDesc: 'अपना रक्त समूह और इमरजेंसी संपर्क जोड़ें ताकि आपातकाल में आपकी सहायता की जा सके।',
    completeProfileBtn: 'प्रोफाइल पूरी करें →',
    maybeLaterBtn: 'शायद बाद में',

    // Toasts & Alerts
    prefSavedToast: 'भाषा प्राथमिकता सुरक्षित कर दी गई।',
    profileSavedToast: 'प्रोफाइल सफलतापूर्वक अपडेट हो गई।',
    recordSavedToast: 'स्वास्थ्य रिकॉर्ड सुरक्षित हो गया।',
    appointmentSavedToast: 'अपॉइंटमेंट सुरक्षित हो गई।',
    prescriptionSavedToast: 'प्रिस्क्रिप्शन सुरक्षित हो गया।',
    contactSavedToast: 'इमरजेंसी संपर्क सुरक्षित हो गया।',
    cardCopiedToast: 'पास लिंक कॉपी कर ली गई।',
    pleaseSignInToast: 'कृपया जारी रखने के लिए साइन इन करें।',
    passwordUpdatedToast: 'पासवर्ड सफलतापूर्वक अपडेट हो गया।',
    resetEmailSentToast: 'पासवर्ड रिकवरी ईमेल भेजा गया। कृपया अपना इनबॉक्स देखें।',
    invalidCredsError: 'गलत ईमेल पता या पासवर्ड। कृपया विवरण की जाँच करें।',
    networkErrorMsg: 'हेल्थकेयर सेवा से कनेक्ट नहीं हो पा रहे हैं। अपना इंटरनेट कनेक्शन जाँचें।',
    rateLimitErrorMsg: 'बहुत सारे प्रयास किए गए। कृपया कुछ क्षण प्रतीक्षा करें।',

    // Common Dropdown Values
    relSpouse: 'पति / पत्नी',
    relParent: 'माता / पिता',
    relChild: 'बेटा / बेटी',
    relSibling: 'भाई / बहन',
    relRelative: 'रिश्तेदार',
    relFriend: 'मित्र',
    relDoctor: 'डॉक्टर',
    relOther: 'अन्य'
  },

  mr: {
    // Brand & Technical terms
    brandName: 'MediKey',
    brandTagline: 'डिजिटल आरोग्य ओळख व्यासपीठ',
    poweredBy: 'Powered by MediKey',
    emergencyDisclaimer: 'तातडीच्या मदतीसाठी डायल करा 112 / 108 / 911',
    sos112: '🚨 SOS 112',
    secureCloud: '● सुरक्षित क्लाउड',
    activeSync: '● सक्रिय',
    offlineStatus: '● स्थिती: ऑफलाइन (इंटरनेट नाही)',
    back: '← मागे',

    // Auth - Login
    welcome: 'पुन्हा स्वागत आहे',
    loginSubtitle: 'तुमचे वैद्यकीय ओळखपत्र आणि आरोग्य नोंदी पाहण्यासाठी लॉगिन करा.',
    email: 'ईमेल पत्ता *',
    emailPlaceholder: 'name@example.com',
    password: 'पासवर्ड *',
    passwordPlaceholder: 'तुमचा पासवर्ड',
    signIn: 'साइन इन करा',
    forgotPassword: 'पासवर्ड विसरलात?',
    newPatient: 'नवीन रुग्ण? नोंदणी करा',
    demoBadge: '🧪 पडताळलेला डेमो रुग्ण',
    demoSubtitle: 'ईमेल पडताळणीची वाट न पाहता त्वरित लॉगिन करा:',
    fillDemoCreds: 'डेमो लॉगिन भरा',

    // Auth - Register
    createAccount: 'तुमचे खाते तयार करा',
    registerSubtitle: 'तुमचा युनिक MediKey डिजिटल हेल्थ आयडी तयार करण्यासाठी नोंदणी करा.',
    fullName: 'पूर्ण नाव *',
    fullNamePlaceholder: 'उदा. राजेश कुमार',
    createPassword: 'पासवर्ड तयार करा *',
    passwordMin: 'किमान 6 अक्षरे',
    confirmPassword: 'पासवर्डची पुष्टी करा *',
    confirmPasswordPlaceholder: 'पासवर्ड पुन्हा प्रविष्ट करा',
    preferredLanguage: 'पसंतीची भाषा / भाषा निवडा / भाषा चुनें',
    registerAccount: 'खाते नोंदणी करा',
    alreadyRegistered: 'आधीच नोंदणी केली आहे?',
    loginHere: 'येथे लॉगिन करा',

    // Auth - Reset Password
    resetPasswordTitle: 'पासवर्ड रीसेट करा',
    resetPasswordSubtitle: 'पासवर्ड पुनर्प्राप्ती लिंक मिळवण्यासाठी तुमचा नोंदणीकृत ईमेल पत्ता प्रविष्ट करा.',
    registeredEmailLabel: 'नोंदणीकृत ईमेल पत्ता *',
    sendRecoveryEmail: 'पुनर्प्राप्ती ईमेल पाठवा',
    backToLogin: 'लॉगिनवर परत जा',

    // Auth - Update Password
    setNewPasswordTitle: 'नवीन पासवर्ड सेट करा',
    updatePasswordSubtitle: 'खाते वापरण्यासाठी खाली नवीन पासवर्ड प्रविष्ट करा.',
    newPasswordLabel: 'नवीन पासवर्ड * (किमान 6 अक्षरे)',
    confirmNewPasswordLabel: 'नवीन पासवर्डची पुष्टी करा *',
    updatePasswordBtn: 'पासवर्ड अपडेट करा',
    cancelAndReturn: 'रद्द करा आणि लॉगिनवर परत जा',
    patientPrivacyNotice: '🔒 रुग्ण गोपनीयता: डेटा एन्क्रिप्टेड आहे आणि सुरक्षित ॲक्सेस नियंत्रणाद्वारे संरक्षित आहे.',

    // Top Header & Menu
    menuLabelLang: 'LANGUAGE / भाषा',
    menuProfile: '♙ प्रोफाइल विहंगावलोकन पहा',
    menuEditProfile: '✎ संपूर्ण प्रोफाइल संपादित करा',
    menuPersonal: '👤 वैयक्तिक ओळख आणि फोटो',
    menuInstallApp: '📲 MediKey ॲप इन्स्टॉल करा',
    menuPrivacy: '🔒 गोपनीयता आणि सुरक्षा',
    menuLogout: '↪ लॉगआउट',

    // Navigation
    navDashboard: 'डॅशबोर्ड',
    navRecords: 'वैद्यकीय रेकॉर्ड',
    navScan: 'QR स्कॅनर',
    navProfile: 'प्रोफाइल आणि सेटिंग्ज',
    bottomHome: 'होम',
    bottomRecords: 'रेकॉर्ड',
    bottomScan: 'स्कॅन',
    bottomProfile: 'प्रोफाइल',

    // Dashboard - Welcome
    helloPatient: 'नमस्कार, रुग्ण',
    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दुपार',
    greetingEvening: 'शुभ संध्याकाळ',
    digitalPassVerified: 'डिजिटल हेल्थकेअर पास · पडताळलेला',

    // Dashboard - Digital Medical ID Card
    idCardBrand: '✚ MediKey हेल्थ ID',
    settingsBtn: '⚙ सेटिंग्ज',
    healthIdLabel: 'हेल्थ ID:',
    shareIdBtn: 'आयडी शेअर करा ↗',
    bloodBadge: '🩸 रक्तगट:',
    allergyBadge: '⚠️ ऍलर्जी:',
    conditionBadge: '⚕️',
    notProvided: 'दिलेले नाही',
    notSpecified: 'नमूद नाही',
    unknown: 'अज्ञात',

    // Dashboard - Emergency SOS Bar
    emergencySummaryTitle: '🛡️ आपत्कालीन आरोग्य सारांश',
    detailsBtn: 'तपशील पहा →',
    icePrefix: 'आपत्कालीन संपर्क:',
    allergiesPrefix: 'ऍलर्जी:',
    callEmergencyContact: '☎ आपत्कालीन संपर्काला कॉल करा',
    addEditContact: 'संपर्क जोडा / बदला',
    noEmergencyContactSaved: 'कोणताही आपत्कालीन संपर्क सेव्ह केलेला नाही.',
    loadingEmergencyDetails: 'आपत्कालीन माहिती लोड होत आहे...',

    // Dashboard - Clinical Priority Cards
    upcomingAppointments: '📅 आगामी अपॉइंटमेंट्स',
    addAppointment: '＋ अपॉइंटमेंट जोडा',
    noAppointments: 'अद्याप कोणतीही अपॉइंटमेंट नाही.',
    activePrescriptions: '💊 चालू औषधे',
    addMedicine: '＋ औषध जोडा',
    noPrescriptions: 'अद्याप कोणतीही औषधे नोंदवलेली नाहीत.',
    recentDocuments: '📄 अलीकडील कागदपत्रे',
    uploadDocument: '＋ कागदपत्र अपलोड करा',
    noDocuments: 'व्हॉल्टमध्ये अद्याप कोणतीही कागदपत्रे अपलोड केलेली नाहीत.',

    // Dashboard - Quick Actions
    quickActionsTitle: '⚡ जलद पर्याय',
    healthcareBadge: 'आरोग्यसेवा',
    qaRecords: 'रेकॉर्ड',
    qaRecordsDesc: 'व्हॉल्ट कागदपत्रे',
    qaMedicines: 'औषधे',
    qaMedicinesDesc: 'सक्रिय औषधे',
    qaVisits: 'भेटी',
    qaVisitsDesc: 'डॉक्टर भेटी',
    qaMedicalKit: 'मेडिकल किट',
    qaMedicalKitDesc: 'प्रथमोपचार',
    qaShareId: 'आयडी शेअर करा',
    qaShareIdDesc: 'संमती QR पास',
    qaHealthLog: 'आरोग्य नोंद',
    qaHealthLogDesc: 'दैनिक आरोग्य',
    qaScanPass: 'पास स्कॅन करा',
    qaScanPassDesc: 'MediKey पडताळा',
    qaIceCard: 'ICE कार्ड',
    qaIceCardDesc: 'रेस्क्यू पास',

    // Dashboard - ICE Card
    iceCardTitle: '🚑 आपत्कालीन संपर्क (ICE)',
    iceCardDesc: 'आपत्कालीन परिस्थितीत प्रथम प्रतिसादकर्ते त्वरित तुमच्या पालकांशी संपर्क साधू शकतात.',
    manageContactsBtn: 'संपर्क व्यवस्थापित करा →',

    // Dashboard - Nearby Hospitals
    nearbyHospitalsTitle: '🏥 जवळची आपत्कालीन रुग्णालये',
    nearbyHospitalsDesc: 'तुमच्या जीपीएस स्थानाजवळील रुग्णालये शोधा.',
    findHospitalsBtn: 'जवळची रुग्णालये शोधा',
    openGoogleMapsBtn: 'गुगल मॅप्समध्ये उघडा',
    hospitalStatusMuted: 'जवळची रुग्णालये शोधण्यासाठी वर टॅप करा.',

    // Dashboard - Privacy Guarantee
    privacyGuaranteeTitle: '🔒 रुग्ण डेटा गोपनीयता संरक्षण',
    privacyBadge: 'सुरक्षित आणि खाजगी',
    privacyGuaranteeDesc: 'तुमचा आरोग्य डेटा सुरक्षितपणे साठवला जातो. आपत्कालीन कर्मचारी फक्त तुम्ही अधिकृत केलेली माहितीच पाहू शकतात.',
    viewArchitectureBtn: 'सुरक्षा आणि संरचना पहा →',

    // View 2: Medical Records
    searchRecordsPlaceholder: 'रेकॉर्ड, औषधे, क्लिनिक शोधा...',
    catAll: 'सर्व रेकॉर्ड',
    catHospital: 'रुग्णालय रेकॉर्ड',
    catPrescriptions: 'प्रिस्क्रिप्शन',
    catLabs: 'लॅब अहवाल',
    catCertificates: 'प्रमाणपत्रे',
    catHistory: 'वैद्यकीय इतिहास',
    catNotes: 'आरोग्य नोंदी',
    catKit: 'मेडिकल किट',
    noRecordsFound: 'या श्रेणीत कोणतेही रेकॉर्ड आढळले नाही.',
    recordDate: 'तारीख',
    recordDoctor: 'डॉक्टर',
    recordFacility: 'रुग्णालय / क्लिनिक',
    recordNotes: 'नोंदी',
    viewAttachment: 'कागदपत्र पहा',
    deleteBtn: 'हटवा',
    editBtn: 'संपादित करा',

    // View 3: QR Scanner
    scannerTitle: 'MediKey आपत्कालीन पास स्कॅन करा',
    scannerTips: 'रुग्णाच्या MediKey QR पासवर कॅमेरा धरा जेणेकरून आपत्कालीन माहिती पाहता येईल.',
    scanFromPhoto: '📷 फोटोमधून स्कॅन करा',
    restartCamera: 'कॅमेरा रीस्टार्ट करा',
    scannerPrivacyNotice: '🔒 गोपनीयता प्रथम: स्कॅनिंग तुमच्या ब्राउझरमध्ये सुरक्षितपणे होते.',

    // View 4: Profile View
    profileOverviewTitle: 'रुग्ण प्रोफाइल विहंगावलोकन',
    profileIdentityGroup: 'आरोग्य ओळख आणि वैद्यकीय माहिती',
    itemProfileOverview: 'संपूर्ण प्रोफाइल विहंगावलोकन पहा',
    itemPersonal: 'वैयक्तिक ओळख आणि फोटो',
    itemContact: 'संपर्क आणि फोन तपशील',
    itemMedical: 'महत्त्वाचे वैद्यकीय घटक (रक्तगट, ऍलर्जी)',
    itemHistory: 'वैद्यकीय आणि शस्त्रक्रिया इतिहास',
    itemICE: 'आपत्कालीन (ICE) संपर्क',
    profileSecurityGroup: 'सुरक्षा, गोपनीयता आणि प्राधान्ये',
    itemQRPass: 'आपत्कालीन QR पास आणि संमती व्यवस्थापित करा',
    itemChangePassword: 'पासवर्ड बदला आणि खाते सुरक्षा',
    itemAppPreferences: 'भाषा आणि ॲप प्राधान्ये',
    itemPrivacyOverview: 'सुरक्षा आणि संरचना विहंगावलोकन',
    itemSignOut: 'MediKey मधून बाहेर पडा',

    // Modals - Profile Fields
    regEmailAccountId: 'नोंदणीकृत ईमेल (खाते आयडी)',
    bloodGroupLabel: 'रक्तगट',
    ageLabel: 'वय',
    yearsOld: 'वर्षे',
    phoneNumberLabel: 'फोन नंबर',
    knownAllergiesLabel: 'ज्ञात ऍलर्जी',
    chronicConditionsLabel: 'जुनाट आजार',
    activeMedicationsLabel: 'चालू औषधे',
    closeBtn: 'बंद करा',
    saveBtn: 'सेव्ह करा',
    saveChangesBtn: 'बदल सेव्ह करा',
    cancelBtn: 'रद्द करा',
    updateBtn: 'अपडेट करा',
    proceedToEdit: '✎ प्रोफाइल संपादित करा',
    editPatientProfile: 'रुग्ण प्रोफाइल संपादित करा',
    tabPersonal: '👤 वैयक्तिक',
    tabContact: '📞 संपर्क',
    tabMedical: '🩺 वैद्यकीय',
    profileAvatarLabel: 'प्रोफाइल फोटो (फोटो निवडण्यासाठी टॅप करा)',
    ageFieldLabel: 'वय',
    accountEmailReadonly: 'खाते ईमेल (फक्त वाचनासाठी)',
    accountEmailNote: 'खाते ईमेल सुरक्षित प्रमाणीकरणाने पडताळलेले आहे आणि येथे बदलता येत नाही.',
    mobileNumberLabel: 'मोबाईल नंबर',
    residentialAddressLabel: 'राहण्याचा पत्ता',
    primaryEmergencyContact: 'प्राथमिक आपत्कालीन संपर्क (पालक)',
    guardianNameLabel: 'पालक / संपर्काचे नाव',
    guardianPhoneLabel: 'आपत्कालीन फोन नंबर',
    guardianRelationshipLabel: 'नाते',
    saveProfileBtn: 'बदल सेव्ह करा',

    // Modals - Medical Info
    criticalMedicalParams: 'महत्त्वाचे वैद्यकीय घटक',
    bloodGroupSelectLabel: 'रक्तगट',
    knownAllergiesField: 'औषध आणि अन्नाची ऍलर्जी',
    chronicConditionsField: 'जुनाट आजार / परिस्थिती',
    currentMedicationsField: 'सध्याची नियमित औषधे',

    // Modals - Medical History & Kit
    medicalHistoryTitle: 'वैद्यकीय आणि शस्त्रक्रिया इतिहास',
    pastSurgeriesField: 'मागील शस्त्रक्रिया आणि प्रक्रिया',
    familyHistoryField: 'कौटुंबिक आरोग्य इतिहास',
    immunizationField: 'लसीकरण आणि लसी',
    medicalKitTitle: 'मेडिकल किट आणि प्रथमोपचार',
    medicalKitDesc: 'घरातील किटमध्ये प्रथमोपचाराची औषधे आणि आपत्कालीन साहित्याची नोंद ठेवा.',
    itemNameLabel: 'साहित्याचे किंवा औषधाचे नाव *',
    itemQuantityLabel: 'प्रमाण / स्थिती',
    itemExpiryLabel: 'कालबाह्यता तारीख / नोंदी',
    addItemBtn: '＋ साहित्य जोडा',

    // Modals - Add Appointment
    addAppointmentTitle: 'अपॉइंटमेंट जोडा',
    doctorSpecialistLabel: 'डॉक्टर / तज्ज्ञांचे नाव *',
    clinicHospitalLabel: 'क्लिनिक / रुग्णालयाचे नाव *',
    appointmentDateTimeLabel: 'तारीख आणि वेळ *',
    appointmentPurposeLabel: 'उद्देश / नोंदी',

    // Modals - Add Prescription
    addPrescriptionTitle: 'चालू प्रिस्क्रिप्शन जोडा',
    medicineNameLabel: 'औषधाचे नाव *',
    dosageStrengthLabel: 'डोस आणि ताकद (उदा. 500mg) *',
    frequencyLabel: 'घेण्याची वेळ (उदा. जेवणानंतर 1-0-1) *',
    prescribingDoctorLabel: 'डॉक्टरांचे नाव',
    durationInstructionsLabel: 'कालावधी आणि विशेष सूचना',

    // Modals - Add Record
    addRecordTitle: 'आरोग्य रेकॉर्ड जोडा',
    recordTitleLabel: 'रेकॉर्डचे शीर्षक *',
    recordCategoryLabel: 'श्रेणी *',
    facilityDoctorLabel: 'डॉक्टर / क्लिनिक / लॅब',
    recordDateLabel: 'तारीख *',
    recordNotesLabel: 'तपशील / नोंदी',
    attachDocumentLabel: 'कागदपत्र जोडा (PDF किंवा फोटो)',

    // Modals - Change Password
    changePasswordTitle: 'पासवर्ड आणि सुरक्षा बदला',
    currentPasswordLabel: 'सध्याचा पासवर्ड *',
    newPasswordChangeLabel: 'नवीन पासवर्ड * (किमान 6 अक्षरे)',
    confirmNewPasswordChangeLabel: 'नवीन पासवर्डची पुष्टी करा *',

    // Modals - App Preferences
    appPreferencesTitle: 'भाषा आणि ॲप प्राधान्ये',
    preferredLanguageSetting: 'पसंतीची भाषा / भाषा निवडा / भाषा चुनें',

    // Modals - Privacy & Architecture
    privacyModalTitle: 'रुग्ण डेटा गोपनीयता आणि रचना',
    privacySection1Title: '🔒 1. वैयक्तिक डेटा नसलेले आपत्कालीन पास',
    privacySection1Desc: 'आपत्कालीन पास सुरक्षित टोकन वापरतात. कार्डवर रुग्णाचे नाव थेट छापलेले नसते.',
    privacySection2Title: '🛡️ 2. रुग्णाची निवडक संमती',
    privacySection2Desc: 'आपत्कालीन परिस्थितीत कोणती माहिती शेअर करायची हे तुम्ही ठरवता.',
    privacySection3Title: '☁️ 3. खाजगी क्लाउड पायाभूत सुविधा',
    privacySection3Desc: 'सर्व रेकॉर्ड सुरक्षित क्लाउड डेटाबेसमध्ये साठवले जातात.',

    // Modals - Emergency Pass & QR Share
    emergencyShareTitle: 'आपत्कालीन पास आणि संमती सेटिंग्ज',
    emergencyPassExplanation: 'एक आपत्कालीन QR पास तयार करा जो स्कॅन करून आपत्कालीन कर्मचारी लॉगिन न करता तुमची माहिती पाहू शकतील.',
    consentAllergies: 'ज्ञात ऍलर्जी शेअर करा',
    consentConditions: 'जुनाट आजार शेअर करा',
    consentMedications: 'चालू औषधे शेअर करा',
    passValidityLabel: 'पासची वैधता कालावधी',
    duration1Day: '24 तास (तात्पुरता पास)',
    duration7Days: '7 दिवस (प्रवास पास)',
    duration30Days: '30 दिवस (मानक पास)',
    duration1Year: '1 वर्ष (दीर्घकालीन पास)',
    generatePassBtn: 'आपत्कालीन पास तयार करा',
    revokePassBtn: 'सक्रिय पास रद्द करा',
    activePassNotice: 'सक्रिय आपत्कालीन पास सध्या वैध आहे.',
    noActivePass: 'कोणताही सक्रिय पास नाही. पास तयार करण्यासाठी खाली टॅप करा.',

    // Modals - PVC Card Export
    pvcCardTitle: 'ब्रँडेड आपत्कालीन QR कार्ड डाउनलोड करा',
    pvcCardSubtitle: 'पाकीट किंवा लॅनयार्डसाठी मानक CR80 भौतिक कार्ड (53.98 × 85.60 mm).',
    downloadPngBtn: 'हाय-रिझोल्यूशन PNG डाउनलोड करा (600 DPI)',
    downloadPdfBtn: 'प्रिंट-तयार PDF डाउनलोड करा',
    pvcInstructions: 'सूचना: 100% स्केलवर पीव्हीसी प्लास्टिक कार्डवर प्रिंट करा.',
    copyPassLinkBtn: 'पास लिंक कॉपी करा',

    // Offline Overlay
    offlineTitle: 'तुम्ही ऑफलाइन आहात',
    offlineSubtitle: 'आरोग्य माहिती पाहण्यासाठी कृपया इंटरनेटशी कनेक्ट करा.',
    retryConnectionBtn: '🔄 पुन्हा प्रयत्न करा',
    callEmergencyOfflineBtn: '🚨 आपत्कालीन 112 ला कॉल करा',

    // PWA Smart Update Banner
    newVersionAvailable: 'नवीन आवृत्ती उपलब्ध आहे',
    updateToGetLatest: 'नवीनतम वैशिष्ट्यांसाठी अपडेट करा.',
    updateNowBtn: 'आत्ता अपडेट करा',
    laterBtn: 'नंतर',

    // iOS Safari Install Modal
    iosInstallTitle: 'iPhone / iPad वर MediKey इन्स्टॉल करा',
    iosInstallStep1: '1. सफारीमध्ये शेअर बटणावर टॅप करा.',
    iosInstallStep2: '2. खाली स्क्रोल करून "होम स्क्रीनवर जोडा" निवडा.',
    gotItBtn: 'समजले',

    // Profile Completion Banner
    profileSetupTitle: 'प्रोफाइल सेटअप',
    completedText: 'पूर्ण',
    profileSetupDesc: 'तुमचा रक्तगट आणि आपत्कालीन संपर्क जोडा जेणेकरून आपत्कालीन मदतीत मदत होईल.',
    completeProfileBtn: 'प्रोफाइल पूर्ण करा →',
    maybeLaterBtn: 'कदाचित नंतर',

    // Toasts & Alerts
    prefSavedToast: 'भाषा प्राधान्य सेव्ह केले.',
    profileSavedToast: 'प्रोफाइल यशस्वीरित्या अपडेट झाली.',
    recordSavedToast: 'आरोग्य रेकॉर्ड सेव्ह झाले.',
    appointmentSavedToast: 'अपॉइंटमेंट सेव्ह झाली.',
    prescriptionSavedToast: 'प्रिस्क्रिप्शन सेव्ह झाले.',
    contactSavedToast: 'आपत्कालीन संपर्क सेव्ह झाला.',
    cardCopiedToast: 'पास लिंक कॉपी केली.',
    pleaseSignInToast: 'कृपया पुढे जाण्यासाठी साइन इन करा.',
    passwordUpdatedToast: 'पासवर्ड यशस्वीरित्या अपडेट झाला.',
    resetEmailSentToast: 'पासवर्ड पुनर्प्राप्ती ईमेल पाठवला. कृपया इनबॉक्स तपासा.',
    invalidCredsError: 'चुकीचा ईमेल पत्ता किंवा पासवर्ड. कृपया माहिती तपासा.',
    networkErrorMsg: 'आरोग्य सेवेशी कनेक्ट करणे शक्य नाही. इंटरनेट तपासा.',
    rateLimitErrorMsg: 'खूप जास्त प्रयत्न केले. कृपया काही वेळ थांबा.',

    // Common Dropdown Values
    relSpouse: 'पती / पत्नी',
    relParent: 'आई / वडील',
    relChild: 'मुलगा / मुलगी',
    relSibling: 'भाऊ / बहीण',
    relRelative: 'नातेवाईक',
    relFriend: 'मित्र',
    relDoctor: 'डॉक्टर',
    relOther: 'इतर'
  }
};

/**
 * Gets currently active application language ('en', 'hi', or 'mr').
 */
export function getLanguage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('medikey_lang');
    if (saved && (saved === 'hi' || saved === 'mr' || saved === 'en')) {
      return saved;
    }
  }
  return 'en';
}

/**
 * Primary translation lookup function.
 * @param {string} key - Dictionary key
 * @param {string} [fallback] - Optional fallback text
 * @returns {string} Translated text
 */
export function t(key, fallback = '') {
  const lang = getLanguage();
  return i18n[lang]?.[key] || i18n.en[key] || fallback || key;
}

/**
 * Applies selected language application-wide:
 * 1. Persists to localStorage
 * 2. Updates document.documentElement.lang
 * 3. Translates all elements with data-i18n, data-i18n-placeholder, data-i18n-title, data-i18n-aria
 * 4. Updates legacy target selectors
 * 5. Dispatches 'medikey:languagechange' event for dynamic modules
 */
export function applyLanguage(lang) {
  if (!lang || !i18n[lang]) {
    lang = 'en';
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('medikey_lang', lang);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;

    // Synchronize select dropdowns if rendered
    const appLangSelect = document.querySelector('#appLanguage');
    if (appLangSelect && appLangSelect.value !== lang) {
      appLangSelect.value = lang;
    }
    const regLangSelect = document.querySelector('#regLanguage');
    if (regLangSelect && regLangSelect.value !== lang) {
      regLangSelect.value = lang;
    }
    const prefLangSelect = document.querySelector('#prefLanguage');
    if (prefLangSelect && prefLangSelect.value !== lang) {
      prefLangSelect.value = lang;
    }

    // Declarative attribute translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (k) el.textContent = t(k);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.getAttribute('data-i18n-html');
      if (k) el.innerHTML = t(k);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.getAttribute('data-i18n-placeholder');
      if (k) el.setAttribute('placeholder', t(k));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const k = el.getAttribute('data-i18n-title');
      if (k) el.setAttribute('title', t(k));
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const k = el.getAttribute('data-i18n-aria');
      if (k) el.setAttribute('aria-label', t(k));
    });

    // Navigation items with icons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      const k = btn.dataset.nav;
      const labelMap = {
        Home: t('bottomHome'),
        Records: t('bottomRecords'),
        Scan: t('bottomScan'),
        Profile: t('bottomProfile')
      };
      const label = labelMap[k];
      if (label) {
        const icon = btn.querySelector('.nav-icon, .nav-tab-icon, span');
        btn.textContent = '';
        if (icon) btn.appendChild(icon);
        btn.append(' ' + label);
      }
    });

    // Quick Actions buttons
    document.querySelectorAll('.quick-card[data-section], .quick-card[data-quick]').forEach(btn => {
      const sec = btn.dataset.section || btn.dataset.quick;
      const strongEl = btn.querySelector('strong');
      const smallEl = btn.querySelector('small');
      if (!strongEl || !smallEl) return;

      if (sec === 'Medical Records') {
        strongEl.textContent = t('qaRecords');
        smallEl.textContent = t('qaRecordsDesc');
      } else if (sec === 'Prescriptions') {
        strongEl.textContent = t('qaMedicines');
        smallEl.textContent = t('qaMedicinesDesc');
      } else if (sec === 'appointments' || sec === 'Visits') {
        strongEl.textContent = t('qaVisits');
        smallEl.textContent = t('qaVisitsDesc');
      } else if (sec === 'medical-kit' || sec === 'Medical Kit') {
        strongEl.textContent = t('qaMedicalKit');
        smallEl.textContent = t('qaMedicalKitDesc');
      } else if (sec === 'Share Health ID' || sec === 'Share ID') {
        strongEl.textContent = t('qaShareId');
        smallEl.textContent = t('qaShareIdDesc');
      } else if (sec === 'Add Health Note' || sec === 'Health Log') {
        strongEl.textContent = t('qaHealthLog');
        smallEl.textContent = t('qaHealthLogDesc');
      } else if (sec === 'Scan QR Code' || sec === 'Scan Pass') {
        strongEl.textContent = t('qaScanPass');
        smallEl.textContent = t('qaScanPassDesc');
      } else if (sec === 'Emergency Card' || sec === 'ICE Card') {
        strongEl.textContent = t('qaIceCard');
        smallEl.textContent = t('qaIceCardDesc');
      }
    });

    // Legacy direct selector mappings for backwards compatibility
    const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    const setHtml = (sel, val) => { const el = document.querySelector(sel); if (el) el.innerHTML = val; };

    set('#loginPanel h1', t('welcome'));
    set('#loginPanel .muted', t('loginSubtitle'));
    set('label[for="loginEmail"]', t('email'));
    set('label[for="loginPassword"]', t('password'));
    set('#loginForm button[type="submit"]', t('signIn'));
    set('#forgotBtn', t('forgotPassword'));
    set('#showRegister', t('newPatient'));

    set('#registerPanel h1', t('createAccount'));
    set('#registerPanel .muted', t('registerSubtitle'));
    set('label[for="regName"]', t('fullName'));
    set('label[for="regEmail"]', t('email'));
    set('label[for="regPassword"]', t('createPassword'));
    set('label[for="regConfirm"]', t('confirmPassword'));
    set('label[for="regLanguage"]', t('preferredLanguage'));
    set('#registerForm button[type="submit"]', t('registerAccount'));
    set('#registerPanel .auth-links span', t('alreadyRegistered'));
    set('#showLogin', t('loginHere'));

    set('#forgotPanel h1', t('resetPasswordTitle'));
    set('#forgotPanel .muted', t('resetPasswordSubtitle'));
    set('label[for="resetEmail"]', t('registeredEmailLabel'));
    set('#btnSendResetEmail', t('sendRecoveryEmail'));
    set('#backLogin', t('backToLogin'));

    set('#updatePasswordPanel h1', t('setNewPasswordTitle'));
    set('#updatePasswordPanel .muted', t('updatePasswordSubtitle'));
    set('label[for="updatePassword"]', t('newPasswordLabel'));
    set('label[for="updateConfirmPassword"]', t('confirmNewPasswordLabel'));
    set('#btnSubmitNewPassword', t('updatePasswordBtn'));
    set('#btnCancelRecovery', t('cancelAndReturn'));

    set('#privacyBtn', t('menuPrivacy'));
    set('#editBtn', t('menuEditProfile'));
    set('#logoutBtn', t('menuLogout'));
    set('#menuProfile', t('menuProfile'));
    set('#menuPersonal', t('menuPersonal'));
    set('#menuInstallApp', t('menuInstallApp'));

    set('#networkStatus', t('secureCloud'));
    set('#homeSyncStatus', t('activeSync'));
    set('#settingsBtn', t('settingsBtn'));
    set('#emergencyBtn', t('detailsBtn'));
    set('#callEmergencyBtn', t('callEmergencyContact'));
    set('#editEmergencyContactBtn', t('addEditContact'));
    set('#editEmergencyContactBtnSide', t('manageContactsBtn'));

    set('.emergency-bar-header h3', t('emergencySummaryTitle'));
    set('.appointments-card h3', t('upcomingAppointments'));
    set('#btnManageAppointments', t('addAppointment'));
    set('.prescriptions-card h3', t('activePrescriptions'));
    set('#btnManagePrescriptions', t('addMedicine'));
    set('.documents-card h3', t('recentDocuments'));
    set('#btnManageDocuments', t('uploadDocument'));
    set('.quick-actions-card h3', t('quickActionsTitle'));
    set('.quick-actions-card .badge', t('healthcareBadge'));
    set('.ice-card h3', t('iceCardTitle'));
    set('.ice-card p', t('iceCardDesc'));
    set('.hospitals-card h3', t('nearbyHospitalsTitle'));
    set('.hospitals-card p', t('nearbyHospitalsDesc'));
    set('#findHospitalsBtn', t('findHospitalsBtn'));
    set('#openHospitalMapBtn', t('openGoogleMapsBtn'));
    set('#hospitalStatus', t('hospitalStatusMuted'));
    set('.privacy-guarantee-card h3', t('privacyGuaranteeTitle'));
    set('.privacy-guarantee-card .badge', t('privacyBadge'));
    set('.privacy-guarantee-card p', t('privacyGuaranteeDesc'));
    set('#btnLearnPrivacy', t('viewArchitectureBtn'));

    // Category chips in Records view
    const chips = {
      all: t('catAll'),
      medical: t('catHospital'),
      prescriptions: t('catPrescriptions'),
      labs: t('catLabs'),
      certificates: t('catCertificates'),
      history: t('catHistory'),
      notes: t('catNotes'),
      kit: t('catKit')
    };
    document.querySelectorAll('.chip[data-category]').forEach(ch => {
      const cat = ch.dataset.category;
      if (chips[cat]) ch.textContent = chips[cat];
    });

    // Scanner View
    set('#viewScan h2', t('scannerTitle'));
    set('#viewScan .scanner-tips', t('scannerTips'));
    set('#btnRestartScanner', t('restartCamera'));

    // Profile View
    set('#btnViewProfileTab', t('menuProfile'));
    set('#btnEditProfileFromTab', t('menuEditProfile'));
    const pGroups = document.querySelectorAll('.settings-group-header');
    if (pGroups[0]) pGroups[0].textContent = t('profileIdentityGroup');
    if (pGroups[1]) pGroups[1].textContent = t('profileSecurityGroup');

    const pItems = [
      { sel: '#itemPersonalView .settings-item-label', icon: '♙', text: t('itemProfileOverview') },
      { sel: '#itemPersonal .settings-item-label', icon: '👤', text: t('itemPersonal') },
      { sel: '#itemContact .settings-item-label', icon: '📞', text: t('itemContact') },
      { sel: '#itemMedicalInfo .settings-item-label', icon: '🩺', text: t('itemMedical') },
      { sel: '#itemMedicalHistory .settings-item-label', icon: '⚕️', text: t('itemHistory') },
      { sel: '#itemICE .settings-item-label', icon: '🚑', text: t('itemICE') },
      { sel: '#itemQRPass .settings-item-label', icon: '▦', text: t('itemQRPass') },
      { sel: '#itemChangePassword .settings-item-label', icon: '🔑', text: t('itemChangePassword') },
      { sel: '#itemAppPreferences .settings-item-label', icon: '🌐', text: t('itemAppPreferences') },
      { sel: '#itemPrivacy .settings-item-label', icon: '🔒', text: t('itemPrivacyOverview') },
      { sel: '#itemLogout .settings-item-label', icon: '↪', text: t('itemSignOut') }
    ];
    for (const item of pItems) {
      const el = document.querySelector(item.sel);
      if (el) {
        const iconSpan = el.querySelector('.settings-item-icon');
        el.textContent = '';
        if (iconSpan) el.appendChild(iconSpan);
        el.append(' ' + item.text);
      }
    }

    // Welcome Greeting and Health ID localized dynamic sync
    const greetEl = document.querySelector('#welcomeGreeting');
    if (greetEl) {
      const cur = greetEl.textContent;
      const name = cur.includes(',') ? cur.split(',')[1].trim() : (cur.replace(/^(Hello|नमस्ते|नमस्कार)/, '').trim() || 'Patient');
      let prefix = 'Hello';
      if (lang === 'hi') prefix = 'नमस्ते';
      else if (lang === 'mr') prefix = 'नमस्कार';
      greetEl.textContent = (name === 'Patient' || name === 'मरीज') ? t('helloPatient') : `${prefix}, ${name}`;
    }

    const displayIdEl = document.querySelector('#displayId');
    if (displayIdEl) {
      const cur = displayIdEl.textContent;
      const idVal = cur.includes(':') ? cur.split(':')[1].trim() : cur.replace(/^(Health ID|हेल्थ ID)/, '').trim();
      displayIdEl.textContent = `${t('healthIdLabel')} ${idVal || '—'}`;
    }

    // Offline Overlay
    set('#offlineOverlay h3', t('offlineTitle'));
    set('#offlineOverlay .muted', t('offlineSubtitle'));
    set('#btnRetryOffline', t('retryConnectionBtn'));
    set('#offlineOverlay a[href="tel:112"]', t('callEmergencyOfflineBtn'));
    set('#offlineOverlay .offline-status-text span', t('offlineStatus'));

    // PWA Update Banner
    set('#pwaUpdateBanner .update-text strong', t('newVersionAvailable'));
    set('#pwaUpdateBanner .update-text .muted', t('updateToGetLatest'));
    set('#btnPwaUpdateNow', t('updateNowBtn'));
    set('#btnPwaUpdateLater', t('laterBtn'));

    // Notify listeners that language has changed
    window.dispatchEvent(new CustomEvent('medikey:languagechange', { detail: { lang } }));
  }
}

// Auto-apply saved language preference immediately upon load
if (typeof window !== 'undefined' && window.localStorage) {
  const initialLang = getLanguage();
  if (initialLang && initialLang !== 'en') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyLanguage(initialLang));
    } else {
      applyLanguage(initialLang);
    }
  }
}
