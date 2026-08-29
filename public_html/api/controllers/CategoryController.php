<?php

class CategoryController extends Controller
{
    public function index()
    {
        $this->auth();
        $rows = Database::all('SELECT * FROM categories ORDER BY sort_order, name_es');
        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['sort_order'] = (int) $r['sort_order'];
        }
        Response::ok(['categories' => $rows]);
    }
}
