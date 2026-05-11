import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, GraduationCap, Crown, Facebook, Instagram, Youtube } from 'lucide-react';

interface HomeProps {
  onNavigate?: (screen: 'login') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const navigate = useNavigate();

  const handleActionClick = () => {
    if (onNavigate) {
      onNavigate('login');
      return;
    }

    navigate('/login');
  };

  const handleScrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="fixed top-0 z-50 w-full border-b border-surface-container-highest/60 bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-6 md:px-12">
          <div className="brand-font text-2xl font-extrabold uppercase tracking-[-0.08em] text-[#1c1b1b]">
            CueMasters
          </div>
          <button
            type="button"
            onClick={handleActionClick}
            className="rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container"
          >
            Đặt bàn ngay
          </button>
        </div>
      </nav>

      <main>
        <section className="relative flex h-screen w-full items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover"
              alt="Cơ thủ chuyên nghiệp đang chuẩn bị cú đánh"
              src="https://seyberts.com/cdn/shop/articles/billiards_player_1000x.jpg?v=1729084783"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-on-surface/90 via-on-surface/40 to-transparent"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1920px] px-6 md:px-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl space-y-8"
            >
              <motion.h1
                variants={fadeIn}
                className="brand-font text-5xl font-extrabold leading-[1.02] tracking-[-0.08em] text-white md:text-7xl"
              >
                CHƠI HẾT MÌNH.
                <br />
                NGẮM CHUẨN XÁC.
                <br />
                <span className="text-primary">LÀM CHỦ TRẬN ĐẤU.</span>
              </motion.h1>

              <motion.p
                variants={fadeIn}
                className="max-w-2xl text-lg font-medium leading-relaxed text-white/80 md:text-xl"
              >
                Nâng tầm trải nghiệm billiards chuyên nghiệp trong một không gian chỉn chu,
                sang trọng và vận hành mượt mà. Mỗi bàn chơi, mỗi khung giờ, mỗi buổi
                huấn luyện đều được chăm chút để bạn tập trung hoàn toàn vào cú đánh.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-col gap-4 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="rounded-sm bg-primary px-10 py-5 text-base font-bold uppercase tracking-[0.18em] text-on-primary transition-all hover:bg-primary-container"
                >
                  Đặt bàn ngay
                </button>
                <button
                  type="button"
                  onClick={handleScrollToContent}
                  className="rounded-sm border border-white/20 bg-white/10 px-10 py-5 text-base font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all hover:bg-white/20"
                >
                  Tìm hiểu thêm
                </button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-12 hidden items-center gap-4 text-xs uppercase tracking-[0.22em] text-white/50 md:flex"
          >
            <span className="h-[1px] w-12 bg-white/20"></span>
            Kéo để khám phá
          </motion.div>
        </section>

        <section className="bg-surface py-24 md:py-32">
          <div className="mx-auto grid max-w-[1920px] items-center gap-20 px-6 md:grid-cols-2 md:px-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.24em] text-primary">
                <span className="h-[2px] w-8 bg-primary"></span>
                Về chúng tôi
              </div>
              <h2 className="brand-font text-4xl font-extrabold leading-tight tracking-[-0.08em] text-on-surface md:text-6xl">
                TRẢI NGHIỆM BILLIARDS
                <br />
                TOÀN DIỆN
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-secondary">
                Tại CueMasters, chúng tôi không chỉ cung cấp bàn chơi. Chúng tôi thiết kế
                một hệ sinh thái nơi kỹ thuật, sự tập trung và nhịp vận hành chuyên nghiệp
                hòa làm một. Từ bàn đấu đạt chuẩn đến đội ngũ huấn luyện viên giàu kinh
                nghiệm, mọi điểm chạm đều được tinh chỉnh cho trải nghiệm nhất quán.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <div className="mb-1 text-4xl font-black text-on-surface">24+</div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                    Bàn thi đấu
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-4xl font-black text-on-surface">12</div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
                    Huấn luyện viên
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-sm bg-surface-container-high">
                <img
                  className="h-full w-full object-cover"
                  alt="Đầu cơ chạm bi đỏ trên mặt bàn xanh"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzVMh5j1PvXAWjcb2QqZ3YECNadp_Lax-ObFqBTDqM_632Bw8t0y6XWGj1Ym_XG9iSekXBqZC0ILlS9b06RGLj4--Ym4adN9TzOOb51jgLhvU6CPKNO62rl36crOcVlCX8nYSxgC8q968Kgxjx_1Kxnz5UWK4b7l0eDUFfx15c0fTQ-WANiS0UVPz0spxmNdA3M38_jZXxJTWme8EG0reKJnDrIeOtr7sOterDl3fkBAIxAt51EUxl3TURNskt-zLi4mwfD9PApXbp"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 hidden h-64 w-64 flex-col bg-primary p-8 text-on-primary lg:flex">
                <Star className="mb-4 h-10 w-10 fill-current" />
                <p className="text-xl font-bold leading-snug tracking-tight">
                  Tiêu chuẩn câu lạc bộ 5 sao dành cho trải nghiệm thi đấu lẫn thư giãn.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-surface-container-low py-24">
          <div className="mx-auto max-w-[1920px] px-6 md:px-12">
            <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-4">
                <h2 className="brand-font text-4xl font-extrabold tracking-[-0.08em] md:text-5xl">
                  DỊCH VỤ ĐẲNG CẤP
                </h2>
                <p className="max-w-md text-secondary">
                  Được thiết kế tỉ mỉ cho cả người chơi phong trào, học viên nghiêm túc và
                  những buổi thi đấu cần tiêu chuẩn vận hành cao.
                </p>
              </div>
              <button
                type="button"
                className="cursor-pointer border-b-2 border-primary pb-1 font-bold text-on-surface transition-colors hover:text-primary"
                onClick={handleActionClick}
              >
                Xem toàn bộ dịch vụ
              </button>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid h-auto grid-cols-1 gap-6 md:h-[700px] md:grid-cols-12"
            >
              <motion.div
                variants={fadeIn}
                className="group relative cursor-pointer overflow-hidden rounded-sm bg-on-surface md:col-span-8"
                onClick={handleActionClick}
              >
                <img
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                  alt="Cụm bàn thi đấu chuyên nghiệp"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJSAlnJ7myuZsWxy7yiO63nwvb5Rr2ekkzuGwRl-VUDQip50HhJuo0mtzunWOy1iYgaIrXqeTWpzqoxsPo7TXQsob76CJsE9f2SCX_LtoA3DuO-5v3X3NIL_sIJB646d-Rfj-wZ7kAA8iECn8BOQomLTyB9D29QlFXnQUaxKuQDba6PGqrnEuP2HPQGBp1C15Bg4wc8hDOJrBlMdcqecJjNTCSY2uQq-xBfR52uV0dT6i7F7tuGkHf6-HIKcpnl7SyAVZqd6ahB6ky"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-transparent to-transparent"></div>
                <div className="absolute bottom-0 space-y-4 p-10">
                  <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-md">
                    Pro Choice
                  </span>
                  <h3 className="brand-font text-3xl font-bold uppercase tracking-tight text-white">
                    Bàn thi đấu chuyên nghiệp
                  </h3>
                  <p className="max-w-md text-white/70">
                    Sử dụng bàn chất lượng cao cùng mặt nỉ chuẩn, đảm bảo độ chính xác ổn
                    định cho cả buổi luyện tập lẫn trận đấu nghiêm túc.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="group relative cursor-pointer overflow-hidden rounded-sm bg-surface-container-lowest md:col-span-4"
                onClick={handleActionClick}
              >
                <div className="flex h-full flex-col justify-between p-10">
                  <div className="space-y-6">
                    <GraduationCap className="h-10 w-10 text-primary" />
                    <h3 className="brand-font text-2xl font-bold uppercase tracking-tight">
                      Huấn luyện 1 kèm 1
                    </h3>
                    <p className="text-secondary">
                      Lộ trình cá nhân hóa từ kỹ thuật nền tảng đến chiến thuật nâng cao, giúp
                      bạn thấy rõ tiến bộ qua từng buổi học.
                    </p>
                  </div>
                  <img
                    className="mt-6 h-48 w-full rounded-sm object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                    alt="Huấn luyện viên chỉnh tay cầm cơ cho học viên"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuIvWeMH5IxELDizUYWXL5c74lX6KtKBntmCBbvURgctsb1X848XRrzryjWRnDyWYUjlBWAS1TM-K6Ico3ct6535KRJSe2foFk5SCSMBNZjWbCsW8IpPIYTvfKPSexRwUJSzK1wS4IWZML_b0yPCdwHlGmUT87boatflKsehaPj_prpz7eOv-bt0Cspcvor4K4bMV8OvWRozBIWZKfpZYR4ytTS23NBMuZvYdkSmuV55lBdopwFbzSPW4_cOyYKRp5AzvMipGI1NEU"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="group relative cursor-pointer overflow-hidden rounded-sm bg-on-surface md:col-span-4"
                onClick={handleActionClick}
              >
                <img
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  alt="Khu quầy đồ ăn và thức uống của câu lạc bộ"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr25_H8pNZvpRIFBA0rpL_6zghQiCzahlbvTMVxrwsAG0gez1TS6AA2iMG2CayjaQGue4YJVeD41bK9ztQvOtBHUg-ZSVz8uX9Ecv5kXXqpafzCS9YvFfMEgueDVsGWOXpJc2a09ntEhCpyDbEReYsFhqHPwpyBUfXhj9cNtyyJDbArzek1OQCWU3TtPkdZ3jOpoVN8ZdlX0XXvBE2MKtq3xxgbGQncTLe71NwKi6pc7P7oTiJnnK9_Ny0b-cX6CGM-BdzCxswpL7a"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent"></div>
                <div className="absolute bottom-0 p-10">
                  <h3 className="brand-font text-2xl font-bold uppercase tracking-tight text-white">
                    Thực đơn F&amp;B cao cấp
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="relative flex cursor-pointer items-center justify-between overflow-hidden rounded-sm bg-primary p-10 md:col-span-8"
                onClick={handleActionClick}
              >
                <div className="z-10 max-w-md space-y-4">
                  <h3 className="brand-font text-3xl font-bold uppercase tracking-tight text-on-primary">
                    Khu lounge riêng tư
                  </h3>
                  <p className="text-on-primary/80">
                    Không gian phù hợp cho những buổi gặp gỡ quan trọng, làm việc nhanh hoặc
                    thư giãn giữa các trận đấu.
                  </p>
                </div>
                <Crown className="absolute -bottom-10 -right-10 h-[200px] w-[200px] -rotate-12 text-white/10" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-on-surface py-24 text-white md:py-32">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
            <svg className="h-full w-full text-white" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" fill="transparent" r="180" stroke="currentColor" strokeWidth="1"></circle>
              <circle cx="200" cy="200" fill="transparent" r="140" stroke="currentColor" strokeWidth="1"></circle>
              <line stroke="currentColor" x1="200" x2="200" y1="0" y2="400"></line>
              <line stroke="currentColor" x1="0" x2="400" y1="200" y2="200"></line>
            </svg>
          </div>

          <div className="relative z-10 mx-auto max-w-[1920px] px-6 text-center md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-3xl space-y-10"
            >
              <h2 className="brand-font text-5xl font-extrabold leading-none tracking-[-0.08em] md:text-7xl">
                GIA NHẬP CỘNG ĐỒNG
                <br />
                CƠ THỦ CHỈN CHU
              </h2>
              <p className="text-lg font-medium text-white/60 md:text-xl">
                Mở tài khoản để đặt bàn nhanh hơn, theo dõi lịch sử chơi, đăng ký huấn luyện
                và nhận quyền lợi dành riêng cho thành viên CueMasters.
              </p>

              <div className="flex flex-wrap justify-center gap-6 pt-6">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="rounded-full bg-primary px-12 py-5 text-base font-black uppercase tracking-[0.18em] text-on-primary transition-transform hover:scale-105"
                >
                  Đăng ký thành viên
                </button>
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="rounded-full border-2 border-white/20 px-12 py-5 text-base font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white hover:text-on-surface"
                >
                  Mở tài khoản
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-container-highest bg-surface-container-high">
        <div className="mx-auto flex w-full max-w-[1920px] flex-col items-center justify-between px-6 py-16 md:flex-row md:px-12">
          <div className="mb-10 space-y-4 md:mb-0">
            <div className="brand-font text-xl font-bold uppercase tracking-[-0.08em] text-on-surface">
              CueMasters Precision Atelier
            </div>
            <div className="flex gap-4">
              <Facebook className="h-6 w-6 cursor-pointer text-secondary transition-colors hover:text-primary" />
              <Instagram className="h-6 w-6 cursor-pointer text-secondary transition-colors hover:text-primary" />
              <Youtube className="h-6 w-6 cursor-pointer text-secondary transition-colors hover:text-primary" />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium md:gap-12">
            <button type="button" className="cursor-pointer text-secondary transition-opacity duration-200 hover:text-primary hover:underline" onClick={handleActionClick}>
              Chính sách bảo mật
            </button>
            <button type="button" className="cursor-pointer text-secondary transition-opacity duration-200 hover:text-primary hover:underline" onClick={handleActionClick}>
              Điều khoản sử dụng
            </button>
            <button type="button" className="cursor-pointer text-secondary transition-opacity duration-200 hover:text-primary hover:underline" onClick={handleActionClick}>
              Liên hệ
            </button>
            <button type="button" className="cursor-pointer text-secondary transition-opacity duration-200 hover:text-primary hover:underline" onClick={handleActionClick}>
              Câu lạc bộ
            </button>
          </div>

          <div className="mt-12 text-center text-sm text-secondary md:mt-0 md:text-right">
            © 2026 CueMasters Precision Atelier. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}
