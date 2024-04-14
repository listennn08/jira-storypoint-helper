import { useEffect } from 'react'
import { useNavigate } from 'react-router'

const NotFound = (): JSX.Element => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/')
  }, [])
  return <></>
}

export default NotFound
