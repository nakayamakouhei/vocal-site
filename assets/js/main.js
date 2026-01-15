window.addEventListener("load", () => {
    // リロード時のスクロール復元を無効化（対応ブラウザのみ）
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    // 必ず先頭へ
    window.scrollTo(0, 0);

    const hero = document.querySelector(".hero");
    const home = document.querySelector(".home");
    if (!hero || !home) return;

    // Welcome中はスクロール禁止
    document.body.classList.add("is-locked");

    // フェードイン
    hero.classList.add("is-visible");

    // 2.5秒後にフェードアウト
    setTimeout(() => {
        hero.classList.add("is-hidden");
    }, 2500);

    // フェードアウト完了後
    setTimeout(() => {
        hero.style.display = "none";
        home.classList.add("is-visible");
        document.body.classList.remove("is-locked");
        window.scrollTo(0, 0); // 念のため
    }, 2500 + 1200);
});
  