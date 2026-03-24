import styles from "../components/Support.module.css";
import FaqManagement from "../components/FaqManagement";

const Faqs = () => {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 className={styles.pageTitle}>Frequently Asked Questions</h1>
        </div>
      </div>

      <FaqManagement />
    </div>
  );
};

export default Faqs;
