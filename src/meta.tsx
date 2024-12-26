const
    version = "0.12.2",
    dev = true,
    date = "2024.12.26",
    api = "https://focapi.feiyang.ac.cn",
    about = (()=>(<div style={{fontSize: 16}}>
        <div style={{display: "flex", justifyContent: "center"}}><img src="https://feiyang.ac.cn/img/logo1080.png" height={200} alt="logo" /></div>
        <h3 style={{marginBottom: "1rem"}}>关于云上飞扬</h3>
        <blockquote style={{color: "var(--c-grey-4)"}}>前身：小川电脑管家，是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现<strong>个人设备报修</strong>、<strong>设备问题搜索</strong>等功能，我们旨在为大家提供一个完备的<strong>个人设备一体化服务系统</strong>，让学习和生活变得便捷高效！</blockquote>
        <h4 style={{marginBottom: "1rem"}}>云上飞扬 1.0</h4>
        在飞扬社团的转型启航之际，本系统改名升级，完全重写，在保留之前的小川电脑管家全部功能的同时，前端后端都进行了全面升级，并进行了业务范围的扩展，旨在为同学们提供更好的使用体验。
        <h4>制作团队</h4>
        <table style={{borderCollapse: "collapse", margin: "1rem 0"}}>
            <colgroup style={{width: "8rem", padding: "0"}}></colgroup>
            <colgroup style={{width: "8rem", padding: "0"}}></colgroup>
            <colgroup style={{width: "8rem", padding: "0"}}></colgroup>
            <tbody>
                <tr>
                    <td><img src="https://lab.feiyang.ac.cn/images/huzongyao.jpg" alt="胡宗尧的头像" height={80} /></td>
                    <td>胡宗尧</td><td>小程序开发</td>
                </tr>
                <tr>
                    <td><img src="https://lab.feiyang.ac.cn/images/wangjialin.jpg" alt="王嘉麟的头像" height={80} /></td>
                    <td><a href="//wjlo.cc" target="_blank">王嘉麟</a></td><td>后端开发</td>
                </tr>
                <tr>
                    <td><img src="https://lab.feiyang.ac.cn/images/linjunming.jpg" alt="林峻茗的头像" height={80} /></td>
                    <td><a href="//i.ljm.im" target="_blank">林峻茗</a></td><td>管理后台开发</td>
                </tr>
            </tbody>
        </table>
        <p>版本：{version}</p>
        <p>日期：{date}</p>
        <p>开发版：{dev ? "true" : "false"}</p>
        <p><a href="//fyscu.com" target="_blank">四川大学飞扬俱乐部</a><a href="//lab.fyscu.com" target="_blank">研发部</a> 出品</p>
        <p>源码仓库：<a href="//github.com/fyscu/foc_fe_admin" target="_blank">https://github.com/fyscu/foc_fe_admin</a></p>
    </div>))(),
    meta = {version, dev, date, apiDomain: api, about};

export default meta;