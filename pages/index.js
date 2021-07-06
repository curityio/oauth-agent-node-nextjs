import styles from '../styles/Home.module.css'

import useSwr from 'swr'
const fetcher = (url) => fetch(url).then((res) => res.json())

const login = () => {
  const { data, error } = useSwr('/api/login', fetcher)
  if (data.location) {
    window.location = location;
  }
}

export default function Home() {
  return (
    <div className={styles.container}>
      <a href={} onClick={() => login()}>Login</a>
    </div>
  )
}
