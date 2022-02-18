import { useState, useEffect } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { getFrame, getPage } from '@cloudinary/url-gen/actions/extract';

import styles from './Viewer.module.scss';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'colbycloud'
  },
  url: {
    secure: true
  }
});

function getPdfPage({ src, page }) {
  return cld.image(src)
    .setDeliveryType('fetch')
    .format('jpg')
    .extract(getPage().byNumber(page))
    .toURL();
}

const Viewer = ({ src, width, height }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [pages = {}, setPages] = useState({});
  const [totalPages, setTotalPages] = useState();

  const slides = Object.keys(pages).map(key => {
    return {
      src: pages[key],
      pageNumber: parseInt(key)
    };
  });

  // Get the first page and refresh the

  useEffect(() => {
    const page = getPdfPage({ src, page: 1 });
    setPages({ 1: page })
  }, [src]);

  useEffect(() => {
    (async function run() {
      const newPages = {...pages};

      // Look through the current slide and next slides to try to preload any
      // new or previous slides depending on the position, but only do so
      // if we don't already have it loaded

      if ( currentSlide - 1 > 0 && !newPages[currentSlide - 1] ) {
        const prev = getPdfPage({ src, page: currentSlide - 1 });
        const imageExists = await fetch(prev).then(res => res.ok);

        if ( imageExists ) {
          newPages[currentSlide - 1] = prev;
        }
      }

      if ( !newPages[currentSlide] ) {
        const current = getPdfPage({ src, page: currentSlide });
        const imageExists = await fetch(current).then(res => res.ok);

        if ( imageExists ) {
          newPages[currentSlide] = current;
        }
      }

      if ( !newPages[currentSlide + 1] ) {
        const next = getPdfPage({ src, page: currentSlide + 1 });
        const imageExists = await fetch(next).then(res => res.ok);

        if ( imageExists ) {
          newPages[currentSlide + 1] = next;
        } else {
          // If our next image doesn't exist, that means we're at the end of
          // the PDF so we want to additionally set our total pages to prevent
          // further navigation and loading attempts
          setTotalPages(Object.keys(newPages).length);
        }
      }

      setPages(newPages);
    })();
  }, [currentSlide])

  function handleOnNextSlide() {
    setCurrentSlide(currentSlide + 1);
  }

  function handleOnPrevSlide() {
    if ( currentSlide - 1 <= 0 ) return;
    setCurrentSlide(currentSlide - 1);
  }

  return (
    <>
      <div className={styles.viewer}>
        {slides.length > 0 && (
          <>
            <ul className={styles.slides} style={{
              aspectRatio: `${width} / ${height}`
            }}>
              {slides.map(({ src, pageNumber }) => {
                return (
                  <li key={src}
                    className={styles.slide}
                    data-is-active-slide={currentSlide === pageNumber}
                    data-is-prev-slide={currentSlide === pageNumber - 1}
                    data-is-next-slide={currentSlide === pageNumber + 1}
                  >
                    <img src={src} alt={`Page ${pageNumber}`} loading="lazy" />
                  </li>
                )
              })}
            </ul>
            <p>
              <button onClick={handleOnPrevSlide} disabled={currentSlide - 1 <= 0}>Prev</button>
              <button onClick={handleOnNextSlide} disabled={totalPages === currentSlide}>Next</button>
            </p>
          </>
        )}
        <noscript>
          <a href={src}>{ src }</a>
        </noscript>
      </div>
    </>
  )
}

export default Viewer;