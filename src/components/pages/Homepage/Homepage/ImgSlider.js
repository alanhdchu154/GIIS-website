import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function ImgSlider() {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };

    // Function to import all images starting with 'homepage'
    const importAll = (r) => {
        return r.keys().map((fileName) => ({
            src: r(fileName),
            alt: `Campus scene - ${fileName.split('/').pop().replace(/^homepage/, '').replace(/\.\w+$/, '').replace(/[-_]/g, ' ')}`  // Create a descriptive alt text
        }));
    };

    // Automatically import all images from a directory
    const images = importAll(require.context('../../../../img/Homepage', false, /homepage.*\.(png|jpe?g|svg)$/));

    return (
        <Slider {...settings}>
            {images.map((image, index) => (
                <div key={index}>
                    <img
                        src={image.src}
                        alt={image.alt}
                        style={{ width: '100%', height: '520px', objectFit: 'cover', display: 'block' }}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                    />
                </div>
            ))}
        </Slider>
    );
}

export default ImgSlider;
