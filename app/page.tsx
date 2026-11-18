import Container from "@/components/Container";
import Image from "next/image";
export default function Page() {
  return (
    <>
      <Container className="px-8 mt-4">
        <section>
          <div className="flex flex-col lg:flex-row lg:flex-row lg:items-center gap-6 lg:gap-12">
            <div className="w-full aspect-[4/3] bg-black rounded-4xl"></div>
            <div className="flex flex-col gap-4">
              <div className="font-bold text-4xl text-gray-900 leading-[1.3]">
                ものづくりの
                <br />
                部活です。
              </div>
              <p className="text-gray-700 text-sm">
                海城中高物理部では、電子工作やプログラミング、ゲーム制作など、技術系の活動を幅広く行っています。
              </p>
              <a
                href="/about"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full w-fit text-sm"
              >
                詳しく見る
              </a>
            </div>
          </div>
        </section>
      </Container>
      <Container className="px-2 mt-24">
        <div className="px-6 py-8 bg-white rounded-4xl">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-4xl font-bold text-gray-900">Articles</h2>
            <p className="text-gray-700 text-sm">記事</p>
          </div>
        </div>
      </Container>
    </>
  );
}
