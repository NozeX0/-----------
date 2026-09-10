const API_URL = 'https://dummyjson.com/products';

const state = {
    limit: 10,
    skip: 0,
    total: 0,
    search: '',
    sort: ''
};

let localProducts = JSON.parse(localStorage.getItem('added_products')) || [];

const dom = {
    productsContainer: document.getElementById('products'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    limitSelect: document.getElementById('limitSelect'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageInfo: document.getElementById('pageInfo'),
    formModal: document.getElementById('formModal'),
    productForm: document.getElementById('productForm'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    closeFormModal: document.getElementById('closeFormModal'),
    modalTitle: document.getElementById('modalTitle'),
    productId: document.getElementById('productId'),
    productTitle: document.getElementById('productTitle'),
    productPrice: document.getElementById('productPrice'),
    productDescription: document.getElementById('productDescription')
};

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadProducts();
});

function bindEvents() {
    dom.searchBtn.addEventListener('click', handleSearch);

    dom.searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    dom.sortSelect.addEventListener('change', event => {
        state.sort = event.target.value;
        state.skip = 0;
        loadProducts();
    });

    dom.limitSelect.addEventListener('change', event => {
        state.limit = Number(event.target.value);
        state.skip = 0;
        loadProducts();
    });

    dom.prevBtn.addEventListener('click', () => {
        if (state.skip >= state.limit) {
            state.skip -= state.limit;
            loadProducts();
        }
    });

    dom.nextBtn.addEventListener('click', () => {
        if (state.skip + state.limit < state.total) {
            state.skip += state.limit;
            loadProducts();
        }
    });

    dom.openAddModalBtn.addEventListener('click', () => {
        openModal();
    });

    dom.closeFormModal.addEventListener('click', closeModal);

    dom.formModal.addEventListener('click', event => {
        if (event.target === dom.formModal) {
            closeModal();
        }
    });

    dom.productForm.addEventListener('submit', saveProduct);
}

async function loadProducts() {
    showLoading();

    try {
        let url;

        if (state.search) {
            url = `${API_URL}/search?q=${encodeURIComponent(state.search)}&limit=${state.limit}&skip=${state.skip}`;
        } else {
            url = `${API_URL}?limit=${state.limit}&skip=${state.skip}`;
        }

        if (state.sort) {
            const [sortBy, order] = state.sort.split('-');
            url += `&sortBy=${sortBy}&order=${order}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        let products = data.products || [];

        const newLocalProducts = localProducts.filter(
            product =>
                typeof product.id === 'string' &&
                product.id.startsWith('local_')
        );

        if (state.skip === 0 && !state.search) {
            products = [...newLocalProducts, ...products];
        }

        products = products.map(product => {
            const localVersion = localProducts.find(
                localProduct =>
                    String(localProduct.id) === String(product.id)
            );

            return localVersion || product;
        });

        state.total = data.total + newLocalProducts.length;

        renderProducts(products);
        updatePagination();

    } catch (error) {
        console.error(error);

        dom.productsContainer.innerHTML = `
            <div class="empty-state">
                Не удалось загрузить товары.<br>
                Проверьте подключение к интернету и попробуйте ещё раз.
            </div>
        `;
    }
}

function renderProducts(products) {
    dom.productsContainer.innerHTML = '';

    if (!products || products.length === 0) {
        dom.productsContainer.innerHTML = `
            <div class="empty-state">
                Товары не найдены
            </div>
        `;

        return;
    }

    products.forEach(product => {
        const card = document.createElement('article');

        card.className = 'product-card';

        const image =
            product.thumbnail ||
            'https://dummyjson.com/image/200x200';

        card.innerHTML = `
            <div class="card-image">
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(product.title)}"
                >

                <span class="badge">
                    $${formatPrice(product.price)}
                </span>
            </div>

            <div class="card-info">
                <h3>${escapeHtml(product.title)}</h3>

                <p>
                    ${escapeHtml(product.description)}
                </p>

                <div class="card-actions">
                    <button
                        class="btn-detail"
                        type="button"
                    >
                        Характеристики →
                    </button>

                    <button
                        class="btn-edit"
                        type="button"
                        data-id="${escapeAttribute(product.id)}"
                    >
                        Редактировать
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', event => {
            const editButton = event.target.closest('.btn-edit');

            if (editButton) {
                event.stopPropagation();
                openEditModal(product.id, product);
                return;
            }

            window.location.href =
                `product.html?id=${encodeURIComponent(product.id)}`;
        });

        dom.productsContainer.appendChild(card);
    });
}

function handleSearch() {
    state.search = dom.searchInput.value.trim();
    state.skip = 0;
    loadProducts();
}

function updatePagination() {
    const currentPage =
        Math.floor(state.skip / state.limit) + 1;

    const totalPages =
        Math.ceil(state.total / state.limit) || 1;

    dom.pageInfo.textContent =
        `${currentPage} из ${totalPages}`;

    dom.prevBtn.disabled =
        state.skip === 0;

    dom.nextBtn.disabled =
        state.skip + state.limit >= state.total;
}

function showLoading() {
    dom.productsContainer.innerHTML = `
        <div class="empty-state">
            Загрузка товаров...
        </div>
    `;
}

function openModal(product = null) {
    if (product) {
        dom.modalTitle.textContent = 'Редактировать товар';

        dom.productId.value = product.id;
        dom.productTitle.value = product.title || '';
        dom.productPrice.value = product.price || '';
        dom.productDescription.value = product.description || '';
    } else {
        dom.modalTitle.textContent = 'Добавить товар';

        dom.productForm.reset();
        dom.productId.value = '';
    }

    dom.formModal.classList.add('active');
    dom.productTitle.focus();
}

function closeModal() {
    dom.formModal.classList.remove('active');
    dom.productForm.reset();
    dom.productId.value = '';
}

async function openEditModal(id, currentProduct = null) {
    if (currentProduct) {
        openModal(currentProduct);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);

        if (!response.ok) {
            throw new Error();
        }

        const product = await response.json();

        openModal(product);

    } catch (error) {
        console.error(error);
        alert('Не удалось получить данные товара.');
    }
}

async function saveProduct(event) {
    event.preventDefault();

    const id = dom.productId.value.trim();
    const title = dom.productTitle.value.trim();
    const price = Number(dom.productPrice.value);
    const description = dom.productDescription.value.trim();

    if (!title || !description || price < 0) {
        alert('Заполните все поля корректно.');
        return;
    }

    const payload = {
        title,
        price,
        description,
        thumbnail: 'https://dummyjson.com/image/200x200'
    };

    const isEdit = Boolean(id);

    const url = isEdit
        ? `${API_URL}/${id}`
        : `${API_URL}/add`;

    const method = isEdit
        ? 'PUT'
        : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        console.log(
            isEdit ? 'Ответ PUT:' : 'Ответ POST:',
            result
        );

        const savedProduct = {
            ...payload,
            id: isEdit ? id : `local_${Date.now()}`,
            category: result.category || 'Общая',
            rating: result.rating || 5
        };

        const existingIndex = localProducts.findIndex(
            product =>
                String(product.id) === String(savedProduct.id)
        );

        if (existingIndex !== -1) {
            localProducts[existingIndex] = savedProduct;
        } else {
            localProducts.unshift(savedProduct);
        }

        localStorage.setItem(
            'added_products',
            JSON.stringify(localProducts)
        );

        alert(
            isEdit
                ? 'Товар успешно обновлён!'
                : 'Товар успешно добавлен!'
        );

        closeModal();

        state.skip = 0;

        loadProducts();

    } catch (error) {
        console.error(error);
        alert('Ошибка при сохранении товара.');
    }
}

function formatPrice(price) {
    const number = Number(price);

    if (Number.isNaN(number)) {
        return '0.00';
    }

    return number.toFixed(2);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}