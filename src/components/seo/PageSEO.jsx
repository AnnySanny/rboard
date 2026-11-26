import { useEffect } from "react";

const SITE_URL = "https://rboard.netlify.app";

const PageSEO = ({
    title,
    description,
    path = "/",
    image = `${SITE_URL}/logo.webp`,
    robots = "index, follow",
    children,
}) => {
    const canonicalUrl = `${SITE_URL}${path}`;

    useEffect(() => {
        const previousTitle = document.title;
        const cleanups = [];

        document.title = title;

        const setTag = (
            tagName,
            key,
            name,
            attribute,
            value
        ) => {
            let element = document.head.querySelector(
                `${tagName}[${key}="${name}"]`
            );

            const existed = Boolean(element);

            if (!element) {
                element = document.createElement(tagName);
                element.setAttribute(key, name);
                document.head.appendChild(element);
            }

            const previousValue =
                element.getAttribute(attribute);

            element.setAttribute(attribute, value);

            cleanups.push(() => {
                if (!existed) {
                    element.remove();
                } else if (previousValue === null) {
                    element.removeAttribute(attribute);
                } else {
                    element.setAttribute(
                        attribute,
                        previousValue
                    );
                }
            });
        };

        setTag(
            "meta",
            "name",
            "description",
            "content",
            description
        );

        setTag(
            "meta",
            "name",
            "robots",
            "content",
            robots
        );

        setTag(
            "link",
            "rel",
            "canonical",
            "href",
            canonicalUrl
        );

        setTag(
            "meta",
            "property",
            "og:title",
            "content",
            title
        );

        setTag(
            "meta",
            "property",
            "og:description",
            "content",
            description
        );

        setTag(
            "meta",
            "property",
            "og:url",
            "content",
            canonicalUrl
        );

        setTag(
            "meta",
            "property",
            "og:image",
            "content",
            image
        );

        setTag(
            "meta",
            "property",
            "og:type",
            "content",
            "website"
        );

        setTag(
            "meta",
            "name",
            "twitter:card",
            "content",
            "summary_large_image"
        );

        setTag(
            "meta",
            "name",
            "twitter:title",
            "content",
            title
        );

        setTag(
            "meta",
            "name",
            "twitter:description",
            "content",
            description
        );

        setTag(
            "meta",
            "name",
            "twitter:image",
            "content",
            image
        );

        return () => {
            document.title = previousTitle;

            cleanups.reverse().forEach((cleanup) => {
                cleanup();
            });
        };
    }, [
        title,
        description,
        canonicalUrl,
        image,
        robots,
    ]);

    return children ?? null;
};

export default PageSEO;