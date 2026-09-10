const API_URL = 'https://dummyjson.com/products';

const productDetail =
    document.getElementById('productDetail');

function getProductIdFromUrl() {
    const params =
        new URLSearchParams(window.location.search);

    return params.get('id');
}

async function loadProductDetails() {
    const productId =
        getProductIdFromUrl();

    if (!productId) {
        showError('Товар не найден');
        return;
    }

    try {
        const localProducts =
            JSON.parse(
                localStorage.getItem('added_products')
            ) || [];

        const localProduct =
            localProducts.find(
                product =>
                    String(product.id) ===
                    String(productId)
            );

        if (localProduct) {
            renderProductDetail(localProduct);
            return;
        }

        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(productId)}`
            );

        if (!response.ok) {
            throw new Error(
                `HTTP error: ${response.status}`
            );
        }

        const product =
            await response.json();

        renderProductDetail(product);

    } catch (error) {
        console.error(error);

        showError(
            'Ошибка загрузки товара'
        );
    }
}

function renderProductDetail(product) {
    document.title =
        `${product.title} — Характеристики`;

    const image =
        product.thumbnail ||
        'https://dummyjson.com/image/200x200';

    productDetail.innerHTML = `
        <div class="detail-card">

            <div class="detail-media">
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(product.title)}"
                >
            </div>

            <div class="detail-content">

                <span class="detail-category">
                    ${escapeHtml(
                        product.category || 'Общая'
                    )}
                </span>

                <h2>
                    ${escapeHtml(product.title)}
                </h2>

                <p class="description">
                    ${escapeHtml(product.description)}
                </p>

                <div class="product-specs">

                    <div class="spec-row">
                        <span>Категория</span>
                        <strong>
                            ${escapeHtml(
                                product.category ||
                                'Общая'
                            )}
                        </strong>
                    </div>

                    <div class="spec-row">
                        <span>Рейтинг</span>
                        <strong>
                            ${product.rating ?? '5'} / 5
                        </strong>
                    </div>

                    ${
                        product.brand
                            ? `
                                <div class="spec-row">
                                    <span>Бренд</span>
                                    <strong>
                                        ${escapeHtml(
                                            product.brand
                                        )}
                                    </strong>
                                </div>
                            `
                            : ''
                    }

                    ${
                        product.stock !== undefined
                            ? `
                                <div class="spec-row">
                                    <span>В наличии</span>
                                    <strong>
                                        ${product.stock} шт.
                                    </strong>
                                </div>
                            `
                            : ''
                    }

                </div>

                <div class="price-row">
                    <span class="price-value">
                        $${formatPrice(product.price)}
                    </span>
                </div>

                <button
                    class="buy-btn buy-detail-btn"
                    id="buyBtn"
                    type="button"
                >
                    Купить
                </button>

            </div>
        </div>
    `;

    const buyButton =
        document.getElementById('buyBtn');

    buyButton.addEventListener(
        'click',
        () => {
            alert(
                'Товар добавлен в корзину!'
            );
        }
    );
}

function showError(message) {
    productDetail.innerHTML = `
        <div class="empty-state">
            ${escapeHtml(message)}
        </div>
    `;
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

loadProductDetails();