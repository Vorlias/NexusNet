import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<"svg">> | undefined;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Contextual Networking API",
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        <p>
          Network Objects are managed entirely by Nexus. All you need is the
          identifiers.
        </p>
        <p>The code is segregated, to make the APIs more clean and clear.</p>
      </>
    ),
  },
  {
    title: "Serialization, Buffers and Middleware",
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        <p>
          Nexus has Serialization support built right in, as well as buffer encoding for type structures.
        </p>
        <p>
          We also support middleware for adding hooks into networking processes
        </p>
      </>
    ),
  },
  {
    title: "Static API",
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        <p>
          Nexus is declared <i>statically</i>, and validated <i>statically</i> - this means that any network traffic is ensured to be of the correctly given types
        </p>
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        {Svg && <Svg className={styles.featureSvg} role="img" />}
      </div>
      <div className="padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
