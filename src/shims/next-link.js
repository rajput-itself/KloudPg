import { Link as RouterLink } from 'react-router-dom';

function isExternal(url) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

export default function Link({ href, to, children, ...props }) {
  const target = to ?? href ?? '/';

  if (typeof target !== 'string' || isExternal(target) || props.target === '_blank') {
    return (
      <a href={typeof target === 'string' ? target : '#'} {...props}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={target} {...props}>
      {children}
    </RouterLink>
  );
}
