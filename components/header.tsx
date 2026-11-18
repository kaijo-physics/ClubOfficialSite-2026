import Image from "next/image";
import icon from "@/public/物理部ロゴ.svg";
import Container from "@/components/Container";
export default function Header() {
  return (
    <header>
      <Container className="px-6 py-6">
        <a href="/" className="flex gap-2 items-center">
          <Image src={icon} alt="物理部ロゴ" width={50} height={50}></Image>
          <div>
            <span className="block text-[12px] -mb-1">海城中学高等学校</span>
            <span className="block text-[24px]">物理部</span>
          </div>
        </a>
      </Container>
    </header>
  );
}
