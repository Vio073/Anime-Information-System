    let currentData = []; // Menyimpan daftar data anime saat ini
    let filteredData = []; // Menyimpan data anime yang sedang difilter
    let currentPage = 1; // Melacak halaman saat ini untuk paginasi
    const itemsPerPage = 12; // Jumlah item anime yang ditampilkan per halaman
    let currentRating = 0; // Menyimpan rating saat ini yang dipilih di modal rating
    let currentReviewAnimeId = null; // Menyimpan ID anime yang sedang diulas

    const API_BASE_URL = 'https://api.jikan.moe/v4'; // URL dasar untuk Jikan API

    const elements = {
        searchInput: document.getElementById('searchInput'), // Elemen input untuk mencari anime
        searchBtn: document.getElementById('searchBtn'),     // Tombol untuk memicu pencarian anime
        genreFilter: document.getElementById('genreFilter'), // Dropdown untuk filter berdasarkan genre
        statusFilter: document.getElementById('statusFilter'), // Dropdown untuk filter berdasarkan status
        sortFilter: document.getElementById('sortFilter'),   // Dropdown untuk mengurutkan anime
        loading: document.getElementById('loading'),         // Elemen indikator loading
        error: document.getElementById('error'),             // Elemen pesan error
        resultsCount: document.getElementById('resultsCount'), // Elemen untuk menampilkan jumlah hasil
        count: document.getElementById('count'),             // Elemen untuk menampilkan angka jumlah sebenarnya
        animeGrid: document.getElementById('animeGrid'),     // Kontainer untuk menampilkan kartu anime
        favoritesSection: document.getElementById('favoritesSection'), // Bagian untuk menampilkan anime favorit
        favoritesGrid: document.getElementById('favoritesGrid'), // Kontainer untuk menampilkan kartu anime favorit
        pagination: document.getElementById('pagination'),   // Kontainer kontrol paginasi
        prevBtn: document.getElementById('prevBtn'),         // Tombol untuk halaman sebelumnya
        nextBtn: document.getElementById('nextBtn'),         // Tombol untuk halaman berikutnya
        pageInfo: document.getElementById('pageInfo'),       // Elemen untuk menampilkan informasi halaman saat ini
        animeModal: document.getElementById('animeModal'),   // Modal untuk menampilkan detail anime
        modalBody: document.getElementById('modalBody'),     // Konten badan modal detail anime
        ratingModal: document.getElementById('ratingModal'), // Modal untuk mengirim rating/ulasan
        ratingModalBody: document.getElementById('ratingModalBody'), // Konten badan modal rating
        reviewText: document.getElementById('reviewText'),   // Textarea untuk menulis ulasan
        userReviews: document.getElementById('userReviews'), // Kontainer untuk menampilkan ulasan pengguna
        showFavoritesBtn: document.getElementById('showFavoritesBtn') // Tombol untuk beralih bagian favorit
    };

    document.addEventListener('DOMContentLoaded', function() { // Event listener untuk saat DOM selesai dimuat
        loadPopularAnime(); // Memuat anime populer saat halaman dimuat
        setupEventListeners(); // Menyiapkan semua event listener lainnya
    });

    function setupEventListeners() { // Fungsi untuk menyiapkan berbagai event listener
        elements.searchInput.addEventListener('keypress', function(e) { // Event listener untuk penekanan tombol pada input pencarian
            if (e.key === 'Enter') { // Memeriksa apakah tombol yang ditekan adalah 'Enter'
                searchAnime(); // Memicu pencarian anime jika 'Enter' ditekan
            }
        });

        elements.animeModal.addEventListener('click', function(e) { // Event listener untuk klik pada modal detail anime
            if (e.target === elements.animeModal) { // Memeriksa apakah klik terjadi pada latar belakang modal
                closeModal(); // Menutup modal detail anime
            }
        });

        elements.ratingModal.addEventListener('click', function(e) { // Event listener untuk klik pada modal rating
            if (e.target === elements.ratingModal) { // Memeriksa apakah klik terjadi pada latar belakang modal
                closeRatingModal(); // Menutup modal rating
            }
        });

        document.addEventListener('keydown', function(e) { // Event listener untuk peristiwa keydown pada dokumen
            if (e.key === 'Escape') { // Memeriksa apakah tombol yang ditekan adalah 'Escape'
                closeModal(); // Menutup modal detail anime
                closeRatingModal(); // Menutup modal rating
            }
        });
    }

    function showLoading() { // Fungsi untuk menampilkan indikator loading
        elements.loading.classList.remove('hidden'); // Menghapus kelas 'hidden' untuk menampilkan loading
        elements.error.classList.add('hidden');     // Menyembunyikan pesan error
        elements.animeGrid.innerHTML = '';           // Mengosongkan konten grid anime
        elements.pagination.classList.add('hidden'); // Menyembunyikan kontrol paginasi
        elements.resultsCount.classList.add('hidden'); // Menyembunyikan jumlah hasil
    }

    function hideLoading() { // Fungsi untuk menyembunyikan indikator loading
        elements.loading.classList.add('hidden'); // Menambahkan kelas 'hidden' untuk menyembunyikan loading
    }

    function showError() { // Fungsi untuk menampilkan pesan error
        elements.error.classList.remove('hidden'); // Menghapus kelas 'hidden' untuk menampilkan error
        elements.loading.classList.add('hidden');   // Menyembunyikan indikator loading
        elements.animeGrid.innerHTML = '';           // Mengosongkan konten grid anime
        elements.pagination.classList.add('hidden'); // Menyembunyikan kontrol paginasi
        elements.resultsCount.classList.add('hidden'); // Menyembunyikan jumlah hasil
    }

    async function loadPopularAnime() { // Fungsi asinkron untuk memuat anime populer
        showLoading(); // Menampilkan indikator loading
        
        try {
            const response = await fetch(`${API_BASE_URL}/top/anime?limit=25`); // Mengambil data anime populer dari API
            
            if (!response.ok) { // Memeriksa apakah respons tidak berhasil (status HTTP bukan 2xx)
                throw new Error(`HTTP error! status: ${response.status}`); // Melemparkan error jika respons tidak ok
            }
            
            const data = await response.json(); // Mengurai respons JSON
            currentData = data.data || []; // Menyimpan data anime ke currentData, atau array kosong jika tidak ada data
            filteredData = [...currentData]; // Menginisialisasi filteredData dengan salinan currentData
            
            hideLoading(); // Menyembunyikan indikator loading
            displayAnime(); // Menampilkan anime di grid
            updateResultsCount(); // Memperbarui jumlah hasil yang ditampilkan
            
        } catch (error) { // Menangkap error yang terjadi selama proses fetch
            console.error('Error loading popular anime:', error); // Mencetak error ke konsol
            hideLoading(); // Menyembunyikan indikator loading
            showError(); // Menampilkan pesan error
        }
    }

    async function searchAnime() { // Fungsi asinkron untuk mencari anime
        const query = elements.searchInput.value.trim(); // Mendapatkan nilai input pencarian dan menghapus spasi di awal/akhir
        
        if (!query) { // Jika query kosong
            loadPopularAnime(); // Memuat anime populer (kembali ke tampilan default)
            return; // Menghentikan eksekusi fungsi
        }
        
        showLoading(); // Menampilkan indikator loading
        
        try {
            const response = await fetch(`${API_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=25`); // Mengambil data anime berdasarkan query dari API
            
            if (!response.ok) { // Memeriksa apakah respons tidak berhasil (status HTTP bukan 2xx)
                throw new Error(`HTTP error! status: ${response.status}`); // Melemparkan error jika respons tidak ok
            }
            
            const data = await response.json(); // Mengurai respons JSON
            currentData = data.data || []; // Menyimpan data anime ke currentData
            filteredData = [...currentData]; // Menginisialisasi filteredData dengan salinan currentData
            currentPage = 1; // Mereset halaman saat ini ke 1
            
            hideLoading(); // Menyembunyikan indikator loading
            displayAnime(); // Menampilkan anime di grid
            updateResultsCount(); // Memperbarui jumlah hasil yang ditampilkan
            
        } catch (error) { // Menangkap error yang terjadi selama proses fetch
            console.error('Error searching anime:', error); // Mencetak error ke konsol
            hideLoading(); // Menyembunyikan indikator loading
            showError(); // Menampilkan pesan error
        }
    }

    function filterByGenre() { // Fungsi untuk memfilter anime berdasarkan genre
        const selectedGenre = elements.genreFilter.value; // Mendapatkan nilai genre yang dipilih dari dropdown
        applyFilters(); // Menerapkan semua filter yang aktif
    }

    function filterByStatus() { // Fungsi untuk memfilter anime berdasarkan status
        const selectedStatus = elements.statusFilter.value; // Mendapatkan nilai status yang dipilih dari dropdown
        applyFilters(); // Menerapkan semua filter yang aktif
    }

    function applyFilters() { // Fungsi untuk menerapkan semua filter ke data anime
        const selectedGenre = elements.genreFilter.value; // Mendapatkan genre yang dipilih
        const selectedStatus = elements.statusFilter.value; // Mendapatkan status yang dipilih
        
        filteredData = currentData.filter(anime => { // Memfilter currentData untuk membuat filteredData
            let genreMatch = true; // Variabel untuk melacak apakah genre cocok
            let statusMatch = true; // Variabel untuk melacak apakah status cocok
            
            if (selectedGenre) { // Jika genre dipilih
                genreMatch = anime.genres && anime.genres.some(genre => // Memeriksa apakah anime memiliki genre yang cocok
                    genre.name.toLowerCase().includes(selectedGenre.toLowerCase())
                );
            }
            
            if (selectedStatus) { // Jika status dipilih
                statusMatch = anime.status === selectedStatus; // Memeriksa apakah status anime cocok
            }
            
            return genreMatch && statusMatch; // Mengembalikan true jika kedua filter cocok
        });
        
        currentPage = 1; // Mereset halaman saat ini ke 1 setelah filter diterapkan
        displayAnime(); // Menampilkan anime yang sudah difilter
        updateResultsCount(); // Memperbarui jumlah hasil yang ditampilkan
    }

    function sortData() { // Fungsi untuk mengurutkan data anime
        const sortBy = elements.sortFilter.value; // Mendapatkan kriteria pengurutan yang dipilih
        
        if (!sortBy) return; // Jika tidak ada kriteria pengurutan yang dipilih, keluar dari fungsi
        
        switch (sortBy) { // Melakukan pengurutan berdasarkan kriteria yang dipilih
            case 'title': // Jika diurutkan berdasarkan judul
                filteredData.sort((a, b) => a.title.localeCompare(b.title)); // Mengurutkan secara alfabetis berdasarkan judul
                break;
            case 'score': // Jika diurutkan berdasarkan skor
                filteredData.sort((a, b) => (b.score || 0) - (a.score || 0)); // Mengurutkan dari skor tertinggi ke terendah
                break;
            case 'year': // Jika diurutkan berdasarkan tahun
                filteredData.sort((a, b) => { // Mengurutkan berdasarkan tahun rilis
                    const yearA = a.aired?.from ? new Date(a.aired.from).getFullYear() : 0; // Mendapatkan tahun rilis anime A, atau 0 jika tidak ada
                    const yearB = b.aired?.from ? new Date(b.aired.from).getFullYear() : 0; // Mendapatkan tahun rilis anime B, atau 0 jika tidak ada
                    return yearB - yearA; // Mengurutkan dari tahun terbaru ke terlama
                });
                break;
        }
        
        displayAnime(); // Menampilkan anime yang sudah diurutkan
    }

    function displayAnime() { // Fungsi untuk menampilkan anime di grid
        const startIndex = (currentPage - 1) * itemsPerPage; // Menghitung indeks awal untuk data halaman saat ini
        const endIndex = startIndex + itemsPerPage; // Menghitung indeks akhir untuk data halaman saat ini
        const pageData = filteredData.slice(startIndex, endIndex); // Mengambil data untuk halaman saat ini
        
        if (pageData.length === 0) { // Jika tidak ada data di halaman ini
            elements.animeGrid.innerHTML = '<div class="no-results">No anime found matching your criteria.</div>'; // Menampilkan pesan 'tidak ada hasil'
            elements.pagination.classList.add('hidden'); // Menyembunyikan kontrol paginasi
            return; // Menghentikan eksekusi fungsi
        }
        
        const animeCards = pageData.map(anime => createAnimeCard(anime)).join(''); // Membuat kartu HTML untuk setiap anime dan menggabungkannya
        elements.animeGrid.innerHTML = animeCards; // Menempatkan kartu anime ke dalam grid
        
        pageData.forEach(anime => { // Mengiterasi setiap anime di halaman saat ini
            const card = document.querySelector(`.anime-card[data-id="${anime.mal_id}"]`); // Mendapatkan elemen kartu anime berdasarkan ID
            if (card) { // Jika kartu ditemukan
                const favoriteBtn = document.createElement('button'); // Membuat elemen tombol baru
                favoriteBtn.className = 'favorite-btn'; // Menambahkan kelas CSS ke tombol favorit
                if (isFavorite(anime.mal_id)) { // Jika anime adalah favorit
                    favoriteBtn.classList.add('active'); // Menambahkan kelas 'active'
                    favoriteBtn.innerHTML = '⭐'; // Mengatur ikon bintang penuh
                } else { // Jika bukan favorit
                    favoriteBtn.innerHTML = '☆'; // Mengatur ikon bintang kosong
                }
                favoriteBtn.onclick = (e) => { // Menambahkan event listener klik ke tombol favorit
                    e.stopPropagation(); // Menghentikan propagasi event untuk mencegah memicu showAnimeDetail
                    toggleFavorite(anime.mal_id); // Memanggil fungsi toggleFavorite
                    favoriteBtn.classList.toggle('active'); // Mengubah kelas 'active'
                    if (favoriteBtn.classList.contains('active')) { // Jika tombol aktif
                        favoriteBtn.innerHTML = '⭐'; // Mengatur ikon bintang penuh
                    } else { // Jika tombol tidak aktif
                        favoriteBtn.innerHTML = '☆'; // Mengatur ikon bintang kosong
                    }
                };
                card.appendChild(favoriteBtn); // Menambahkan tombol favorit ke kartu anime
            }
        });
        
        updatePagination(); // Memperbarui status paginasi
    }

    function createAnimeCard(anime) { // Fungsi untuk membuat string HTML untuk kartu anime
        const title = anime.title || anime.title_english || 'Unknown Title'; // Mendapatkan judul anime, fallback ke judul Inggris atau 'Unknown Title'
        const imageUrl = anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url || 'https://via.placeholder.com/300x400?text=No+Image'; // Mendapatkan URL gambar, fallback ke placeholder
        const score = anime.score ? anime.score.toFixed(1) : 'N/A'; // Mendapatkan skor, format ke 1 desimal atau 'N/A'
        const status = anime.status || 'Unknown'; // Mendapatkan status, atau 'Unknown'
        const year = anime.aired?.from ? new Date(anime.aired.from).getFullYear() : 'N/A'; // Mendapatkan tahun rilis, atau 'N/A'
        const episodes = anime.episodes || 'N/A'; // Mendapatkan jumlah episode, atau 'N/A'
        
        const statusClass = getStatusClass(status); // Mendapatkan kelas CSS berdasarkan status
        
        return `
            <div class="anime-card" data-id="${anime.mal_id}" onclick="showAnimeDetail(${anime.mal_id})">
                <img src="${imageUrl}" alt="${title}" loading="lazy" />
                <div class="anime-info">
                    <h3 class="anime-title">${title}</h3>
                    <div class="anime-details">
                        <div>
                            <span class="anime-score">★ ${score}</span>
                        </div>
                        <div>
                            <span class="anime-status ${statusClass}">${status}</span>
                        </div>
                        <div><strong>Year:</strong> ${year}</div>
                        <div><strong>Episodes:</strong> ${episodes}</div>
                    </div>
                </div>
            </div>
        `; // Mengembalikan string HTML untuk kartu anime
    }

    function getStatusClass(status) { // Fungsi untuk mendapatkan kelas CSS berdasarkan status anime
        switch (status) { // Memeriksa status
            case 'Currently Airing': // Jika sedang tayang
                return 'status-airing'; // Mengembalikan kelas untuk status tayang
            case 'Finished Airing': // Jika sudah selesai tayang
                return 'status-finished'; // Mengembalikan kelas untuk status selesai
            case 'Not yet aired': // Jika belum tayang
                return 'status-upcoming'; // Mengembalikan kelas untuk status akan datang
            default: // Default (misalnya status tidak dikenal)
                return 'status-finished'; // Mengembalikan kelas status selesai secara default
        }
    }

    async function showAnimeDetail(animeId) { // Fungsi asinkron untuk menampilkan detail anime di modal
        showLoading(); // Menampilkan indikator loading
        
        try {
            const response = await fetch(`${API_BASE_URL}/anime/${animeId}`); // Mengambil detail anime dari API berdasarkan ID
            
            if (!response.ok) { // Memeriksa apakah respons tidak berhasil (status HTTP bukan 2xx)
                throw new Error(`HTTP error! status: ${response.status}`); // Melemparkan error jika respons tidak ok
            }
            
            const result = await response.json(); // Mengurai respons JSON
            const anime = result.data; // Mendapatkan data anime dari respons
            
            hideLoading(); // Menyembunyikan indikator loading
            displayAnimeModal(anime); // Menampilkan detail anime di modal
            
        } catch (error) { // Menangkap error yang terjadi selama proses fetch
            console.error('Error loading anime details:', error); // Mencetak error ke konsol
            hideLoading(); // Menyembunyikan indikator loading
            alert('Failed to load anime details. Please try again.'); // Menampilkan pesan alert kepada pengguna
        }
    }

    function displayAnimeModal(anime) { // Fungsi untuk menampilkan detail anime di dalam modal
        const title = anime.title || anime.title_english || 'Unknown Title'; // Mendapatkan judul
        const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400?text=No+Image'; // Mendapatkan URL gambar
        const score = anime.score ? anime.score.toFixed(1) : 'N/A'; // Mendapatkan skor
        const status = anime.status || 'Unknown'; // Mendapatkan status
        const year = anime.aired?.from ? new Date(anime.aired.from).getFullYear() : 'N/A'; // Mendapatkan tahun
        const episodes = anime.episodes || 'N/A'; // Mendapatkan jumlah episode
        const duration = anime.duration || 'N/A'; // Mendapatkan durasi
        const genres = anime.genres ? anime.genres.map(g => g.name).join(', ') : 'N/A'; // Mendapatkan genre
        const studios = anime.studios ? anime.studios.map(s => s.name).join(', ') : 'N/A'; // Mendapatkan studio
        const synopsis = anime.synopsis || 'No synopsis available.'; // Mendapatkan sinopsis
        const source = anime.source || 'N/A'; // Mendapatkan sumber
        const rating = anime.rating || 'N/A'; // Mendapatkan rating usia

        const modalContent = `
            <div class="modal-anime-content">
                <div>
                    <img src="${imageUrl}" alt="${title}" class="modal-anime-image" />
                    <button class="rate-btn" onclick="openRatingModal(${anime.mal_id}, '${title}')">Rate this Anime</button>
                </div>
                <div class="modal-anime-info">
                    <h2>${title}</h2>
                    <div class="modal-anime-details">
                        <div><strong>Score:</strong> <span class="anime-score">★ ${score}</span></div>
                        <div><strong>Status:</strong> <span class="anime-status ${getStatusClass(status)}">${status}</span></div>
                        <div><strong>Year:</strong> ${year}</div>
                        <div><strong>Episodes:</strong> ${episodes}</div>
                        <div><strong>Duration:</strong> ${duration}</div>
                        <div><strong>Genres:</strong> ${genres}</div>
                        <div><strong>Studios:</strong> ${studios}</div>
                        <div><strong>Source:</strong> ${source}</div>
                        <div><strong>Rating:</strong> ${rating}</div>
                    </div>
                    <div class="modal-anime-synopsis">
                        <h3>Synopsis</h3>
                        <p>${synopsis}</p>
                    </div>
                </div>
            </div>
        `; // Membuat konten HTML untuk modal detail anime

        elements.modalBody.innerHTML = modalContent; // Menetapkan konten ke badan modal
        elements.animeModal.classList.remove('hidden'); // Menampilkan modal anime dengan menghapus kelas 'hidden'
        document.body.style.overflow = 'hidden'; // Mencegah scrolling pada body saat modal terbuka
    }

    function closeModal() { // Fungsi untuk menutup modal detail anime
        elements.animeModal.classList.add('hidden'); // Menyembunyikan modal anime dengan menambahkan kelas 'hidden'
        document.body.style.overflow = 'auto'; // Mengizinkan scrolling pada body kembali
    }

    function openRatingModal(animeId, animeTitle) { // Fungsi untuk membuka modal rating
        currentReviewAnimeId = animeId; // Menyimpan ID anime yang akan diulas
        currentRating = 0; // Mereset rating saat ini menjadi 0
        elements.reviewText.value = ''; // Mengosongkan textarea ulasan
        
        const stars = document.querySelectorAll('.rating-stars span'); // Mendapatkan semua elemen bintang rating
        stars.forEach(star => star.classList.remove('active')); // Menghapus kelas 'active' dari semua bintang
        
        loadReviews(animeId); // Memuat ulasan yang sudah ada untuk anime ini
        
        elements.ratingModalBody.querySelector('h2').textContent = `Rate ${animeTitle}`; // Mengatur judul modal rating
        elements.ratingModal.classList.remove('hidden'); // Menampilkan modal rating
    }

    function closeRatingModal() { // Fungsi untuk menutup modal rating
        elements.ratingModal.classList.add('hidden'); // Menyembunyikan modal rating
    }

    function setRating(rating) { // Fungsi untuk mengatur rating bintang
        currentRating = rating; // Menyimpan rating yang dipilih
        const stars = document.querySelectorAll('.rating-stars span'); // Mendapatkan semua elemen bintang rating
        stars.forEach((star, index) => { // Mengiterasi setiap bintang
            if (index < rating) { // Jika indeks bintang kurang dari rating yang dipilih
                star.classList.add('active'); // Menambahkan kelas 'active' (bintang terisi)
            } else { // Jika indeks bintang lebih besar atau sama dengan rating yang dipilih
                star.classList.remove('active'); // Menghapus kelas 'active' (bintang kosong)
            }
        });
    }

    function submitReview() { // Fungsi untuk mengirimkan ulasan
        if (currentRating === 0) { // Jika belum ada rating yang dipilih
            alert('Please select a rating'); // Menampilkan pesan peringatan
            return; // Menghentikan eksekusi fungsi
        }
        
        const reviewText = elements.reviewText.value.trim(); // Mendapatkan teks ulasan dan menghapus spasi di awal/akhir
        if (!reviewText) { // Jika teks ulasan kosong
            alert('Please write a review'); // Menampilkan pesan peringatan
            return; // Menghentikan eksekusi fungsi
        }
        
        const reviews = JSON.parse(localStorage.getItem('reviews')) || {}; // Mendapatkan ulasan dari localStorage, atau objek kosong jika tidak ada
        const animeReviews = reviews[currentReviewAnimeId] || []; // Mendapatkan ulasan untuk anime saat ini, atau array kosong jika tidak ada
        
        const newReview = { // Membuat objek ulasan baru
            rating: currentRating, // Rating yang dipilih
            text: reviewText, // Teks ulasan
            date: new Date().toISOString() // Tanggal ulasan dalam format ISO string
        };
        
        animeReviews.push(newReview); // Menambahkan ulasan baru ke array ulasan anime
        reviews[currentReviewAnimeId] = animeReviews; // Memperbarui ulasan anime di objek ulasan
        localStorage.setItem('reviews', JSON.stringify(reviews)); // Menyimpan ulasan yang diperbarui ke localStorage
        
        loadReviews(currentReviewAnimeId); // Memuat ulang ulasan untuk menampilkan ulasan baru
        elements.reviewText.value = ''; // Mengosongkan textarea ulasan
        currentRating = 0; // Mereset rating saat ini
        setRating(0); // Mengatur ulang tampilan bintang ke 0
        alert('Thank you for your review!'); // Menampilkan pesan terima kasih
    }

    function loadReviews(animeId) { // Fungsi untuk memuat dan menampilkan ulasan pengguna
        const reviews = JSON.parse(localStorage.getItem('reviews')) || {}; // Mendapatkan ulasan dari localStorage
        const animeReviews = reviews[animeId] || []; // Mendapatkan ulasan spesifik untuk animeId ini
        
        if (animeReviews.length === 0) { // Jika tidak ada ulasan untuk anime ini
            elements.userReviews.innerHTML = '<p>No reviews yet. Be the first to review!</p>'; // Menampilkan pesan 'belum ada ulasan'
            return; // Menghentikan eksekusi fungsi
        }
        
        elements.userReviews.innerHTML = '<h3>User Reviews</h3>'; // Menambahkan judul 'User Reviews'
        
        animeReviews.forEach(review => { // Mengiterasi setiap ulasan
            const reviewDate = new Date(review.date); // Membuat objek Date dari string tanggal ulasan
            const reviewElement = document.createElement('div'); // Membuat elemen div baru untuk ulasan
            reviewElement.className = 'review-item'; // Menambahkan kelas CSS ke elemen ulasan
            reviewElement.innerHTML = `
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <div class="review-text">${review.text}</div>
                <div class="review-date">${reviewDate.toLocaleDateString()}</div>
            `; // Mengisi HTML elemen ulasan dengan rating bintang, teks, dan tanggal
            elements.userReviews.appendChild(reviewElement); // Menambahkan elemen ulasan ke kontainer ulasan pengguna
        });
    }

    function toggleFavorite(animeId) { // Fungsi untuk menambah atau menghapus anime dari daftar favorit
        const favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Mendapatkan daftar favorit dari localStorage
        const index = favorites.indexOf(animeId); // Mencari indeks animeId di daftar favorit
        
        if (index === -1) { // Jika animeId tidak ditemukan (bukan favorit)
            favorites.push(animeId); // Menambahkan animeId ke daftar favorit
        } else { // Jika animeId ditemukan (sudah favorit)
            favorites.splice(index, 1); // Menghapus animeId dari daftar favorit
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites)); // Menyimpan daftar favorit yang diperbarui ke localStorage
        
        if (!elements.favoritesSection.classList.contains('hidden')) { // Jika bagian favorit sedang terlihat
            displayFavorites(); // Memperbarui tampilan favorit
        }
    }

    // Check if anime is favorite
    function isFavorite(animeId) { // Fungsi untuk memeriksa apakah anime adalah favorit
        const favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Mendapatkan daftar favorit dari localStorage
        return favorites.includes(animeId); // Mengembalikan true jika animeId ada di daftar favorit, false jika tidak
    }

    function toggleFavoritesSection() { // Fungsi untuk beralih antara tampilan utama dan tampilan favorit
        elements.favoritesSection.classList.toggle('hidden'); // Mengubah visibilitas bagian favorit
        elements.animeGrid.classList.toggle('hidden'); // Mengubah visibilitas grid anime
        elements.pagination.classList.toggle('hidden'); // Mengubah visibilitas paginasi
        elements.resultsCount.classList.toggle('hidden'); // Mengubah visibilitas jumlah hasil
        
        if (!elements.favoritesSection.classList.contains('hidden')) { // Jika bagian favorit sekarang terlihat
            displayFavorites(); // Menampilkan anime favorit
        }
    }

    function displayFavorites() { // Fungsi untuk menampilkan anime favorit di grid favorit
        const favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Mendapatkan daftar ID favorit
        if (favorites.length === 0) { // Jika tidak ada favorit
            elements.favoritesGrid.innerHTML = '<div class="no-results">You have no favorite anime yet.</div>'; // Menampilkan pesan 'belum ada favorit'
            return; // Menghentikan eksekusi
        }
        
        const favoriteAnime = currentData.filter(anime => favorites.includes(anime.mal_id)); // Memfilter currentData untuk mendapatkan anime favorit
        
        if (favoriteAnime.length === 0) { // Jika tidak ada anime favorit yang ditemukan di currentData (mungkin belum dimuat)
            elements.favoritesGrid.innerHTML = '<div class="no-results">No favorite anime found in current results.</div>'; // Menampilkan pesan
            return; // Menghentikan eksekusi
        }
        
        const animeCards = favoriteAnime.map(anime => createAnimeCard(anime)).join(''); // Membuat kartu untuk anime favorit
        elements.favoritesGrid.innerHTML = animeCards; // Menampilkan kartu di grid favorit
        
        favoriteAnime.forEach(anime => { // Mengiterasi setiap anime favorit
            const card = elements.favoritesGrid.querySelector(`.anime-card[data-id="${anime.mal_id}"]`); // Mendapatkan kartu anime di grid favorit
            if (card) { // Jika kartu ditemukan
                const favoriteBtn = document.createElement('button'); // Membuat tombol favorit baru
                favoriteBtn.className = 'favorite-btn active'; // Menambahkan kelas dan menandai sebagai aktif
                favoriteBtn.innerHTML = '⭐'; // Mengatur ikon bintang penuh
                favoriteBtn.onclick = (e) => { // Menambahkan event listener klik
                    e.stopPropagation(); // Menghentikan propagasi event
                    toggleFavorite(anime.mal_id); // Menghapus dari favorit
                    card.remove(); // Menghapus kartu dari DOM
                    if (elements.favoritesGrid.children.length === 0) { // Jika tidak ada lagi favorit di grid
                        elements.favoritesGrid.innerHTML = '<div class="no-results">You have no favorite anime yet.</div>'; // Menampilkan pesan 'belum ada favorit'
                    }
                };
                card.appendChild(favoriteBtn); // Menambahkan tombol favorit ke kartu
            }
        });
    }

    function updateResultsCount() { // Fungsi untuk memperbarui tampilan jumlah hasil
        elements.count.textContent = filteredData.length; // Mengatur teks elemen 'count' dengan jumlah data yang difilter
        elements.resultsCount.classList.remove('hidden'); // Menampilkan elemen 'resultsCount'
    }

    function updatePagination() { // Fungsi untuk memperbarui kontrol paginasi
        const totalPages = Math.ceil(filteredData.length / itemsPerPage); // Menghitung total halaman
        
        if (totalPages <= 1) { // Jika total halaman 1 atau kurang
            elements.pagination.classList.add('hidden'); // Menyembunyikan kontrol paginasi
            return; // Menghentikan eksekusi
        }
        
        elements.pagination.classList.remove('hidden'); // Menampilkan kontrol paginasi
        elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`; // Memperbarui informasi halaman
        
        elements.prevBtn.disabled = currentPage === 1; // Menonaktifkan tombol sebelumnya jika di halaman pertama
        elements.nextBtn.disabled = currentPage === totalPages; // Menonaktifkan tombol berikutnya jika di halaman terakhir
    }

    function changePage(direction) { // Fungsi untuk mengubah halaman (maju atau mundur)
        const totalPages = Math.ceil(filteredData.length / itemsPerPage); // Menghitung total halaman
        const newPage = currentPage + direction; // Menghitung nomor halaman baru
        
        if (newPage >= 1 && newPage <= totalPages) { // Jika halaman baru valid
            currentPage = newPage; // Memperbarui halaman saat ini
            displayAnime(); // Menampilkan anime untuk halaman baru
            
            elements.animeGrid.scrollIntoView({ behavior: 'smooth' }); // Menggulir tampilan ke atas grid anime dengan efek halus
        }
    }

    document.addEventListener('error', function(e) { // Event listener global untuk error
        if (e.target.tagName === 'IMG') { // Jika target error adalah elemen gambar
            e.target.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found'; // Mengganti sumber gambar dengan placeholder 'Image Not Found'
        }
    }, true); // Menggunakan capture phase untuk event listener

    function debounce(func, wait) { // Fungsi debounce untuk membatasi frekuensi pemanggilan fungsi
        let timeout; // Variabel untuk menyimpan ID timeout
        return function executedFunction(...args) { // Mengembalikan fungsi yang akan dieksekusi
            const later = () => { // Fungsi yang akan dipanggil setelah penundaan
                clearTimeout(timeout); // Menghapus timeout sebelumnya
                func(...args); // Memanggil fungsi asli dengan argumennya
            };
            clearTimeout(timeout); // Menghapus timeout sebelumnya setiap kali fungsi dipanggil
            timeout = setTimeout(later, wait); // Menetapkan timeout baru
        };
    }

    const debouncedSearch = debounce(searchAnime, 500); // Membuat versi debounced dari fungsi searchAnime dengan penundaan 500ms

    elements.searchInput.addEventListener('input', function() { // Event listener untuk input pada searchInput
        if (this.value.trim() === '') { // Jika nilai input kosong setelah di-trim
            loadPopularAnime(); // Memuat anime populer
        } else { // Jika ada nilai input
            debouncedSearch(); // Memanggil fungsi pencarian yang di-debounce
        }
    });