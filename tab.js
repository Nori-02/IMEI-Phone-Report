// ✅ تحقق من دعم DOM قبل التنفيذ
document.addEventListener("DOMContentLoaded", () => {
  // مثال: الاستماع لرسائل مخصصة داخل الصفحة
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "IMEI_CHECK") {
      console.log("📡 تم استقبال طلب فحص IMEI:", event.data.imei);
      // يمكنك تنفيذ منطق الفحص هنا أو إرسال طلب إلى الخادم
    }
  });

  // مثال: إرسال رسالة داخل الصفحة
  const sendCheckRequest = (imei) => {
    window.postMessage({ type: "IMEI_CHECK", imei }, "*");
  };

  // زر تجريبي (إن وجد)
  const testBtn = document.getElementById("testCheck");
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      const imei = document.getElementById("checkImei").value.trim();
      sendCheckRequest(imei);
    });
  }
});
