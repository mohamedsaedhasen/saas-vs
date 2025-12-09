import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ERP SaaS</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">
                المميزات
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">
                الأسعار
              </a>
              <a href="#modules" className="text-gray-600 hover:text-indigo-600 transition-colors">
                المديولات
              </a>
              <a href="#contact" className="text-gray-600 hover:text-indigo-600 transition-colors">
                تواصل معنا
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/25"
              >
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              نظام ERP متكامل للشركات الصغيرة والمتوسطة
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-slide-up">
              أدِر أعمالك بكفاءة مع
              <span className="text-transparent bg-clip-text gradient-hero"> نظام ERP </span>
              السحابي
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              نظام محاسبي متكامل يشمل إدارة الحسابات، المخازن، المبيعات، المشتريات،
              شركات الشحن، وربط مع Shopify - كل ذلك في مكان واحد
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                ابدأ تجربتك المجانية
                <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                شاهد العرض التوضيحي
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '+500', label: 'شركة تستخدم النظام' },
                { number: '+10K', label: 'فاتورة شهرياً' },
                { number: '99.9%', label: 'وقت التشغيل' },
                { number: '24/7', label: 'دعم فني' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600">{stat.number}</div>
                  <div className="text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              كل ما تحتاجه لإدارة أعمالك
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              مجموعة متكاملة من الأدوات المصممة لتبسيط عملياتك وزيادة كفاءتك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '📊',
                title: 'نظام محاسبي متكامل',
                description: 'شجرة حسابات مرنة، قيود تلقائية، وتقارير مالية شاملة',
              },
              {
                icon: '📦',
                title: 'إدارة المخازن',
                description: 'تتبع المخزون، تحويلات بين المخازن، وإشعارات الحد الأدنى',
              },
              {
                icon: '🧾',
                title: 'الفواتير والمدفوعات',
                description: 'فواتير مبيعات ومشتريات، سندات قبض وصرف آلية',
              },
              {
                icon: '🚚',
                title: 'شركات الشحن',
                description: 'إدارة شركات الشحن، تتبع الشحنات، وحساب المرتجعات',
              },
              {
                icon: '🛒',
                title: 'ربط Shopify',
                description: 'مزامنة المنتجات والطلبات تلقائياً مع متجرك',
              },
              {
                icon: '📈',
                title: 'تقارير وتحليلات',
                description: 'لوحة تحكم ذكية مع تقارير تفصيلية ورسوم بيانية',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              خطط تناسب حجم أعمالك
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ابدأ مجاناً وقم بالترقية عند الحاجة
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'مجاني',
                price: '0',
                period: 'للأبد',
                features: ['مستخدم واحد', 'شركة واحدة', '50 منتج', 'المحاسبة الأساسية'],
                cta: 'ابدأ مجاناً',
                popular: false,
              },
              {
                name: 'المحترف',
                price: '299',
                period: 'شهرياً',
                features: ['10 مستخدمين', '3 شركات', '5000 منتج', 'كل المديولات', 'ربط Shopify', 'دعم فني'],
                cta: 'ابدأ التجربة',
                popular: true,
              },
              {
                name: 'المؤسسي',
                price: '599',
                period: 'شهرياً',
                features: ['50 مستخدم', '10 شركات', 'منتجات غير محدودة', 'كل المديولات', 'API كامل', 'دعم متميز'],
                cta: 'تواصل معنا',
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${plan.popular
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 scale-105'
                  : 'bg-white shadow-sm border border-gray-100'
                  }`}
              >
                {plan.popular && (
                  <div className="text-sm font-medium bg-white/20 rounded-full px-3 py-1 inline-block mb-4">
                    الأكثر شعبية
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-white/70' : 'text-gray-500'}>
                    ج.م / {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? 'text-white/90' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${plan.popular
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            جاهز لتطوير أعمالك؟
          </h2>
          <p className="text-xl text-white/80 mb-10">
            انضم إلى أكثر من 500 شركة تستخدم نظامنا لإدارة أعمالها بكفاءة
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold text-lg hover:bg-gray-100 transition-all hover:shadow-xl"
          >
            ابدأ تجربتك المجانية الآن
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-xl font-bold">ERP SaaS</span>
              </div>
              <p className="text-gray-400">
                نظام ERP سحابي متكامل لإدارة أعمالك بكفاءة واحترافية
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">المميزات</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الأسعار</a></li>
                <li><a href="#" className="hover:text-white transition-colors">المديولات</a></li>
                <li><a href="#" className="hover:text-white transition-colors">التحديثات</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الوثائق</a></li>
                <li><a href="#" className="hover:text-white transition-colors">تواصل معنا</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@erp-saas.com</li>
                <li>+20 123 456 7890</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ERP SaaS. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
