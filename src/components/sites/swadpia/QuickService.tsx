import { asset, quickServices, src } from "./data";

export function QuickService() {
  return (
    <section className="sec02 max-1180">
      <div className="shadow_box">
        <div className="left">
          <h4>
            <img className="multiples_2" src={asset("/images/2025/img/quick_service.png")} alt="빠른 서비스" />
            빠른 서비스
          </h4>
          <p className="sub_tit">쉽고 빠르게 서비스를 찾아보세요.</p>
        </div>
        <div className="right">
          {quickServices.map((q) => (
            <a key={q.label} className="btn" href={src(q.href)}>
              <img src={asset(q.icon)} alt={q.label} />
              {q.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
