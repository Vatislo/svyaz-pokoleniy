import './Footer.css';

function PersonList({ items, roleFallback, nameFallback }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="footer__people">
      {items.map((item, i) => {
        const role = item?.role || roleFallback;
        const name = item?.name || nameFallback;
        return (
          <li key={item?.id || `${role}-${i}`}>
            <span className="footer__person-role">{role}</span>
            <span className="footer__person-name">{name}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Footer({ footer }) {
  const school = footer?.school || {};
  const replaceHint = 'заменить';
  const specifyHint = 'указать';

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__notice" role="note">
          {footer?.note ||
            'Демонстрационные данные. Замените сведения о школе, авторах и руководителях перед публикацией сайта.'}
        </p>

        <div className="footer__grid">
          <section className="footer__block" aria-labelledby="footer-school">
            <h2 className="footer__heading" id="footer-school">
              Школа-организатор
            </h2>
            <dl className="footer__dl">
              <div>
                <dt>Название</dt>
                <dd>{school.name || `Название школы — ${replaceHint}`}</dd>
              </div>
              <div>
                <dt>Адрес</dt>
                <dd>{school.address || `Город, улица — ${replaceHint}`}</dd>
              </div>
              <div>
                <dt>Сайт школы</dt>
                <dd>{school.site || `Адрес сайта школы — ${replaceHint}`}</dd>
              </div>
            </dl>
          </section>

          <section className="footer__block" aria-labelledby="footer-authors">
            <h2 className="footer__heading" id="footer-authors">
              Авторы проекта
            </h2>
            <PersonList
              items={footer?.authors}
              roleFallback={`Автор проекта — ${specifyHint}`}
              nameFallback={`Фамилия Имя — ${specifyHint}`}
            />
          </section>

          <section className="footer__block" aria-labelledby="footer-supervisors">
            <h2 className="footer__heading" id="footer-supervisors">
              Руководители
            </h2>
            <PersonList
              items={footer?.supervisors}
              roleFallback={`Научный руководитель — ${specifyHint}`}
              nameFallback={`Фамилия Имя — ${specifyHint}`}
            />
          </section>
        </div>

        <p className="footer__legal">{footer?.legal}</p>
      </div>
    </footer>
  );
}
